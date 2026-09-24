const getApiKey = () => {
  const apiKey = process.env.ROUTING_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ROUTING_API_KEY is not configured in server/.env."
    );
  }

  return apiKey;
};


/* =========================================================
   PROVIDER / RETRY ERRORS
========================================================= */

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 700;
const RETRYABLE_HTTP_STATUSES = new Set([
  502,
  503,
  504,
]);

const ROUTE_NOT_FOUND_PATTERN =
  /route could not be found|unable to find a route|could not find routable point|could not find point|cannot find routable point|no route found/i;


class RoutingProviderError extends Error {
  constructor(
    message,
    {
      status = null,
      url = null,
      retryable = false,
      providerMessage = "",
      unroutable = false,
      cause = null,
    } = {}
  ) {
    super(message);

    this.name = "RoutingProviderError";
    this.status = status;
    this.url = url;
    this.retryable = Boolean(retryable);
    this.providerMessage = providerMessage;
    this.unroutable = Boolean(unroutable);

    if (cause) {
      this.cause = cause;
    }
  }
}


const isRoutingProviderError = (error) =>
  error instanceof RoutingProviderError ||
  error?.name === "RoutingProviderError";


const isRoutingProviderRetryableError = (error) =>
  isRoutingProviderError(error) &&
  error.retryable === true;


const isRoutingProviderUnroutableError = (error) => {
  if (!isRoutingProviderError(error)) {
    return false;
  }

  if (error.unroutable) {
    return true;
  }

  const text = [
    error.providerMessage,
    error.message,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    [400, 404, 422].includes(Number(error.status)) &&
    ROUTE_NOT_FOUND_PATTERN.test(text)
  );
};


const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });


const safeInteger = (
  value,
  fallback,
  {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
  } = {}
) => {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    return fallback;
  }

  return parsed;
};


const getRetryConfig = () => ({
  retryCount: safeInteger(
    process.env.ROUTING_RETRY_COUNT,
    DEFAULT_RETRY_COUNT,
    {
      min: 0,
      max: 5,
    }
  ),

  baseDelayMs: safeInteger(
    process.env.ROUTING_RETRY_BASE_DELAY_MS,
    DEFAULT_RETRY_BASE_DELAY_MS,
    {
      min: 100,
      max: 10000,
    }
  ),
});


const retryDelayForAttempt = ({
  retryNumber,
  baseDelayMs,
  retryAfterHeader,
}) => {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);

    if (
      Number.isFinite(seconds) &&
      seconds >= 0
    ) {
      return Math.min(seconds * 1000, 10000);
    }

    const retryDate = new Date(
      retryAfterHeader
    ).getTime();

    if (Number.isFinite(retryDate)) {
      return Math.min(
        Math.max(0, retryDate - Date.now()),
        10000
      );
    }
  }

  return Math.min(
    baseDelayMs *
      2 ** Math.max(0, retryNumber - 1),
    10000
  );
};


const normalizeBaseUrl = (baseUrl) => {
  if (!baseUrl) {
    throw new Error(
      "Routing provider base URL is missing."
    );
  }

  return String(baseUrl)
    .trim()
    .replace(/\/+$/, "");
};


const extractProviderMessage = (data) => {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data.trim();
  }

  if (typeof data.error === "string") {
    return data.error.trim();
  }

  return String(
    data.error?.message ||
      data.message ||
      data.detail ||
      ""
  ).trim();
};


const fetchJsonAttempt = async ({
  url,
  body,
  timeoutMs,
  accept,
}) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: getApiKey(),
        Accept: accept,
        "Content-Type":
          "application/json; charset=utf-8",
      },

      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawResponse = await response.text();

    let data = null;

    if (rawResponse) {
      try {
        data = JSON.parse(rawResponse);
      } catch {
        data = rawResponse;
      }
    }

    return {
      response,
      data,
    };
  } finally {
    clearTimeout(timeout);
  }
};


/* =========================================================
   SHARED POST + TRANSIENT RETRY

   Retries only temporary provider/network failures.
   Validation/auth/route-not-found responses are not retried.
========================================================= */

const requestJson = async ({
  url,
  body,
  timeoutMs = 15000,
  accept = "application/json",
}) => {
  if (typeof fetch !== "function") {
    throw new Error(
      "Node.js 18 or newer is required for routing requests."
    );
  }

  const safeTimeout =
    Number(timeoutMs) > 0
      ? Number(timeoutMs)
      : 15000;

  const {
    retryCount,
    baseDelayMs,
  } = getRetryConfig();

  const totalAttempts = retryCount + 1;
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= totalAttempts;
    attempt += 1
  ) {
    try {
      const {
        response,
        data,
      } = await fetchJsonAttempt({
        url,
        body,
        timeoutMs: safeTimeout,
        accept,
      });

      if (response.ok) {
        return data;
      }

      const providerMessage =
        extractProviderMessage(data);

      const retryable =
        RETRYABLE_HTTP_STATUSES.has(
          response.status
        );

      const unroutable =
        [400, 404, 422].includes(
          response.status
        ) &&
        ROUTE_NOT_FOUND_PATTERN.test(
          providerMessage
        );

      const message = retryable
        ? "Road routing service is temporarily unavailable."
        : providerMessage
          ? `Routing provider HTTP ${response.status}: ${providerMessage}`
          : `Routing provider returned HTTP ${response.status}.`;

      const providerError =
        new RoutingProviderError(message, {
          status: response.status,
          url,
          retryable,
          providerMessage,
          unroutable,
        });

      lastError = providerError;

      console.error(
        "Routing provider request failed"
      );
      console.error("URL:", url);
      console.error(
        "Status:",
        response.status,
        response.statusText
      );
      console.error(
        "Attempt:",
        `${attempt}/${totalAttempts}`
      );
      console.error("Response:", data);

      if (
        !retryable ||
        attempt >= totalAttempts
      ) {
        throw providerError;
      }

      const delayMs = retryDelayForAttempt({
        retryNumber: attempt,
        baseDelayMs,
        retryAfterHeader:
          response.headers.get("retry-after"),
      });

      console.warn(
        `Retrying routing request in ${delayMs} ms.`
      );

      await sleep(delayMs);
    } catch (error) {
      if (isRoutingProviderError(error)) {
        if (
          !error.retryable ||
          attempt >= totalAttempts
        ) {
          throw error;
        }

        lastError = error;
        continue;
      }

      const timedOut =
        error?.name === "AbortError";
      const networkFailure =
        error instanceof TypeError;

      if (!timedOut && !networkFailure) {
        throw error;
      }

      const message = timedOut
        ? "Road routing service request timed out."
        : "Road routing service could not be reached.";

      const providerError =
        new RoutingProviderError(message, {
          url,
          retryable: true,
          cause: error,
        });

      lastError = providerError;

      console.warn(
        "Routing provider transient request failure"
      );
      console.warn("URL:", url);
      console.warn(
        "Attempt:",
        `${attempt}/${totalAttempts}`
      );
      console.warn("Reason:", message);

      if (attempt >= totalAttempts) {
        throw providerError;
      }

      const delayMs = retryDelayForAttempt({
        retryNumber: attempt,
        baseDelayMs,
      });

      console.warn(
        `Retrying routing request in ${delayMs} ms.`
      );

      await sleep(delayMs);
    }
  }

  throw (
    lastError ||
    new RoutingProviderError(
      "Road routing service is temporarily unavailable.",
      {
        retryable: true,
        url,
      }
    )
  );
};


/* =========================================================
   COORDINATE HELPERS
========================================================= */

const validateCoordinate = (coordinate) => {
  if (
    !Array.isArray(coordinate) ||
    coordinate.length < 2 ||
    !Number.isFinite(Number(coordinate[0])) ||
    !Number.isFinite(Number(coordinate[1]))
  ) {
    throw new Error(
      "Invalid routing coordinate."
    );
  }
};


const validateCoordinates = (
  coordinates,
  minimum = 1
) => {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < minimum
  ) {
    throw new Error(
      `At least ${minimum} routing coordinate${
        minimum === 1 ? " is" : "s are"
      } required.`
    );
  }

  coordinates.forEach(validateCoordinate);
};


/* =========================================================
   SNAP TO ROUTING GRAPH

   ORS Snap returns entries in the same order as input.
   null means no graph edge was found inside the radius.
========================================================= */

const getSnappedLocations = async ({
  baseUrl,
  profile,
  locations,
  radius,
  timeoutMs,
}) => {
  validateCoordinates(locations, 1);

  const safeRadius = Number(radius);

  if (
    !Number.isFinite(safeRadius) ||
    safeRadius <= 0
  ) {
    throw new Error(
      "Routing snap radius must be a positive number."
    );
  }

  const data = await requestJson({
    url:
      `${normalizeBaseUrl(baseUrl)}` +
      `/snap/${encodeURIComponent(profile)}/json`,

    body: {
      locations,
      radius: safeRadius,
    },

    timeoutMs,
    accept: "application/json",
  });

  const rows = Array.isArray(data?.locations)
    ? data.locations
    : [];

  if (rows.length !== locations.length) {
    throw new Error(
      "Routing provider returned incomplete snapping data."
    );
  }

  return rows.map((row) => {
    if (
      !row ||
      !Array.isArray(row.location) ||
      row.location.length < 2
    ) {
      return null;
    }

    const lng = Number(row.location[0]);
    const lat = Number(row.location[1]);

    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat)
    ) {
      return null;
    }

    return {
      coordinate: [lng, lat],

      snappedDistanceMeters:
        Number.isFinite(
          Number(row.snapped_distance)
        )
          ? Number(row.snapped_distance)
          : null,
    };
  });
};


const normalizeSnapRadii = (
  values,
  fallback = [500, 2000, 5000, 10000, 20000]
) => {
  const source = Array.isArray(values)
    ? values
    : String(
        process.env.ROUTING_SNAP_RADII_METERS ||
          ""
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  const parsed = source
    .map(Number)
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0 &&
        value <= 100000
    );

  const unique = [...new Set(parsed)].sort(
    (a, b) => a - b
  );

  return unique.length
    ? unique
    : [...fallback];
};


const snapLocationsProgressively = async ({
  baseUrl,
  profile,
  locations,
  radii,
  timeoutMs,
}) => {
  validateCoordinates(locations, 1);

  const safeRadii = normalizeSnapRadii(radii);

  const results = Array(locations.length).fill(
    null
  );

  let unresolved = locations.map(
    (_, index) => index
  );

  for (const radius of safeRadii) {
    if (!unresolved.length) {
      break;
    }

    const batchLocations = unresolved.map(
      (index) => locations[index]
    );

    const batch = await getSnappedLocations({
      baseUrl,
      profile,
      locations: batchLocations,
      radius,
      timeoutMs,
    });

    const nextUnresolved = [];

    batch.forEach((row, batchIndex) => {
      const originalIndex =
        unresolved[batchIndex];

      if (!row) {
        nextUnresolved.push(originalIndex);
        return;
      }

      results[originalIndex] = {
        ...row,
        radiusMeters: radius,
      };
    });

    unresolved = nextUnresolved;
  }

  return results;
};


/* =========================================================
   DIRECTIONS
========================================================= */

const getDirections = async ({
  baseUrl,
  profile,
  coordinates,
  preference,
  timeoutMs,
  radiuses,
}) => {
  if (!profile) {
    throw new Error(
      "Routing transport profile is missing."
    );
  }

  validateCoordinates(coordinates, 2);

  const requestBody = {
    coordinates,
    instructions: false,
  };

  if (preference) {
    requestBody.preference = preference;
  }

  if (Array.isArray(radiuses)) {
    if (radiuses.length !== coordinates.length) {
      throw new Error(
        "Directions radiuses must match the waypoint count."
      );
    }

    requestBody.radiuses = radiuses.map(
      (value) => {
        const number = Number(value);

        if (
          number === -1 ||
          (Number.isFinite(number) && number > 0)
        ) {
          return number;
        }

        throw new Error(
          "Invalid Directions waypoint radius."
        );
      }
    );
  }

  return requestJson({
    url:
      `${normalizeBaseUrl(baseUrl)}` +
      `/directions/${encodeURIComponent(
        profile
      )}/geojson`,

    body: requestBody,
    timeoutMs,
    accept:
      "application/geo+json, application/json",
  });
};


/* =========================================================
   MULTI-WAYPOINT DIRECTIONS
========================================================= */

const getDirectionsBatched = async ({
  baseUrl,
  profile,
  coordinates,
  preference,
  timeoutMs,
  maxWaypoints = 50,
  radiuses,
}) => {
  if (!Array.isArray(coordinates)) {
    throw new Error(
      "Routing coordinates must be an array."
    );
  }

  if (coordinates.length < 2) {
    return {
      distanceMeters: 0,
      durationSeconds: 0,
      geometry: {
        type: "LineString",
        coordinates: [...coordinates],
      },
      parts: 0,
    };
  }

  validateCoordinates(coordinates, 2);

  if (
    Array.isArray(radiuses) &&
    radiuses.length !== coordinates.length
  ) {
    throw new Error(
      "Directions radiuses must match the waypoint count."
    );
  }

  const safeLimit = Math.max(
    2,
    Math.min(50, Number(maxWaypoints) || 50)
  );

  const chunks = [];
  let start = 0;

  while (start < coordinates.length - 1) {
    const end = Math.min(
      start + safeLimit,
      coordinates.length
    );

    const chunkCoordinates =
      coordinates.slice(start, end);

    if (chunkCoordinates.length >= 2) {
      chunks.push({
        coordinates: chunkCoordinates,
        radiuses: Array.isArray(radiuses)
          ? radiuses.slice(start, end)
          : undefined,
      });
    }

    if (end === coordinates.length) {
      break;
    }

    start = end - 1;
  }

  let distanceMeters = 0;
  let durationSeconds = 0;
  const combinedCoordinates = [];

  for (
    let index = 0;
    index < chunks.length;
    index += 1
  ) {
    const response = await getDirections({
      baseUrl,
      profile,
      coordinates: chunks[index].coordinates,
      preference,
      timeoutMs,
      radiuses: chunks[index].radiuses,
    });

    const feature = response?.features?.[0];
    const summary =
      feature?.properties?.summary;
    const geometry = feature?.geometry;

    if (
      !summary ||
      !geometry ||
      !Array.isArray(geometry.coordinates)
    ) {
      throw new Error(
        "Routing provider returned incomplete directions data."
      );
    }

    distanceMeters += Number(
      summary.distance || 0
    );
    durationSeconds += Number(
      summary.duration || 0
    );

    const partCoordinates =
      geometry.coordinates;

    if (!combinedCoordinates.length) {
      combinedCoordinates.push(
        ...partCoordinates
      );
    } else {
      combinedCoordinates.push(
        ...partCoordinates.slice(1)
      );
    }
  }

  return {
    distanceMeters,
    durationSeconds,
    geometry: {
      type: "LineString",
      coordinates: combinedCoordinates,
    },
    parts: chunks.length,
  };
};


/* =========================================================
   MATRIX
========================================================= */

const getMatrix = async ({
  baseUrl,
  profile,
  locations,
  sources,
  destinations,
  timeoutMs,
}) => {
  if (!profile) {
    throw new Error(
      "Routing transport profile is missing."
    );
  }

  validateCoordinates(locations, 2);

  const requestBody = {
    locations,
    metrics: [
      "distance",
      "duration",
    ],
    units: "m",
  };

  if (
    Array.isArray(sources) &&
    sources.length
  ) {
    requestBody.sources =
      sources.map(String);
  }

  if (
    Array.isArray(destinations) &&
    destinations.length
  ) {
    requestBody.destinations =
      destinations.map(String);
  }

  return requestJson({
    url:
      `${normalizeBaseUrl(baseUrl)}` +
      `/matrix/${encodeURIComponent(profile)}`,

    body: requestBody,
    timeoutMs,
    accept: "application/json",
  });
};


module.exports = {
  getDirections,
  getDirectionsBatched,
  getMatrix,
  getSnappedLocations,
  snapLocationsProgressively,
  normalizeSnapRadii,
  RoutingProviderError,
  isRoutingProviderError,
  isRoutingProviderRetryableError,
  isRoutingProviderUnroutableError,
};
