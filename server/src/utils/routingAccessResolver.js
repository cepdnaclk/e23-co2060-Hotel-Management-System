const pool = require("../config/db");
const {
  getMatrix,
  snapLocationsProgressively,
  isRoutingProviderRetryableError,
} = require("./routingClient");


/* =========================================================
   ROUTING ACCESS RESOLUTION

   explore_places.lat/lng remains the real map/POI position.

   Some POIs (parks, viewpoints, trails, fort interiors, etc.)
   are not themselves a drivable road coordinate. This module
   derives and caches a nearby coordinate on the provider's
   connected driving graph without changing the POI marker.
========================================================= */

const ROUTING_ACCESS_TABLE =
  "trip_route_access_points";

const DEFAULT_SNAP_RADII_METERS = [
  500,
  2000,
  5000,
  10000,
  20000,
];

const DEFAULT_SEARCH_RING_KM = [
  1,
  3,
  7,
  12,
  20,
  30,
  40,
];

const DEFAULT_SEARCH_BEARINGS = 8;
const DEFAULT_CANDIDATE_SNAP_RADIUS_METERS =
  2000;
const DEFAULT_ACCESS_CACHE_HOURS = 720;
const DEFAULT_WARNING_THRESHOLD_METERS = 100;


class RoutingAccessResolutionError extends Error {
  constructor(
    message,
    {
      destinations = [],
      cause = null,
    } = {}
  ) {
    super(message);

    this.name =
      "RoutingAccessResolutionError";

    this.destinations = destinations;

    if (cause) {
      this.cause = cause;
    }
  }
}


const isRoutingAccessResolutionError = (
  error
) =>
  error instanceof
    RoutingAccessResolutionError ||
  error?.name ===
    "RoutingAccessResolutionError";


const coordinateIsValid = (lat, lng) =>
  Number.isFinite(Number(lat)) &&
  Number.isFinite(Number(lng));


const clampNumber = (
  value,
  fallback,
  {
    min = -Infinity,
    max = Infinity,
  } = {}
) => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max
  ) {
    return fallback;
  }

  return number;
};


const uniquePositiveNumbers = (
  values,
  fallback,
  max
) => {
  const parsed = Array.isArray(values)
    ? values
        .map(Number)
        .filter(
          (value) =>
            Number.isFinite(value) &&
            value > 0 &&
            value <= max
        )
    : [];

  const unique = [...new Set(parsed)].sort(
    (a, b) => a - b
  );

  return unique.length
    ? unique
    : [...fallback];
};


const getAccessConfig = (
  routingProvider = {}
) => ({
  strategyVersion:
    String(
      routingProvider.routingStrategyVersion ||
        "road-access-v2"
    ),

  enabled:
    routingProvider.snapFallbackEnabled !==
    false,

  cacheHours: clampNumber(
    routingProvider.accessPointCacheHours,
    DEFAULT_ACCESS_CACHE_HOURS,
    {
      min: 1,
      max: 24 * 365,
    }
  ),

  snapRadiiMeters: uniquePositiveNumbers(
    routingProvider.snapRadiiMeters,
    DEFAULT_SNAP_RADII_METERS,
    100000
  ),

  searchRingKm: uniquePositiveNumbers(
    routingProvider.accessSearchRingKm,
    DEFAULT_SEARCH_RING_KM,
    100
  ),

  searchBearings: Math.round(
    clampNumber(
      routingProvider.accessSearchBearings,
      DEFAULT_SEARCH_BEARINGS,
      {
        min: 4,
        max: 16,
      }
    )
  ),

  candidateSnapRadiusMeters: clampNumber(
    routingProvider
      .accessCandidateSnapRadiusMeters,
    DEFAULT_CANDIDATE_SNAP_RADIUS_METERS,
    {
      min: 100,
      max: 10000,
    }
  ),

  warningThresholdMeters: clampNumber(
    routingProvider
      .accessWarningThresholdMeters,
    DEFAULT_WARNING_THRESHOLD_METERS,
    {
      min: 0,
      max: 10000,
    }
  ),
});


const getRoutingLat = (destination) =>
  Number(
    destination.routingLat ??
      destination.lat
  );

const getRoutingLng = (destination) =>
  Number(
    destination.routingLng ??
      destination.lng
  );


const setRoutingAccess = (
  destination,
  {
    lat,
    lng,
    distanceMeters = null,
    sourceType = "provider_snap",
    stale = false,
  }
) => {
  destination.routingLat = Number(lat);
  destination.routingLng = Number(lng);
  destination.routingAccessDistanceMeters =
    Number.isFinite(Number(distanceMeters))
      ? Number(distanceMeters)
      : null;
  destination.routingAccessSourceType =
    sourceType;
  destination.routingAccessStale =
    Boolean(stale);
};


const haversineMeters = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const firstLat = toRadians(Number(lat1));
  const secondLat = toRadians(Number(lat2));
  const deltaLat = toRadians(
    Number(lat2) - Number(lat1)
  );
  const deltaLng = toRadians(
    Number(lng2) - Number(lng1)
  );

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(deltaLng / 2) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};


const destinationPoint = ({
  lat,
  lng,
  distanceKm,
  bearingDegrees,
}) => {
  const earthRadiusKm = 6371;
  const angularDistance =
    Number(distanceKm) / earthRadiusKm;
  const bearing =
    (Number(bearingDegrees) * Math.PI) /
    180;
  const lat1 = (Number(lat) * Math.PI) / 180;
  const lng1 = (Number(lng) * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) *
      Math.cos(angularDistance) +
      Math.cos(lat1) *
        Math.sin(angularDistance) *
        Math.cos(bearing)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) *
        Math.sin(angularDistance) *
        Math.cos(lat1),
      Math.cos(angularDistance) -
        Math.sin(lat1) *
          Math.sin(lat2)
    );

  return [
    (lng2 * 180) / Math.PI,
    (lat2 * 180) / Math.PI,
  ];
};


const uniqueDestinationsFromDays = (days) => {
  const byPlaceId = new Map();

  days.forEach((day) => {
    day.validDestinations.forEach(
      (destination) => {
        if (
          destination.placeId &&
          !byPlaceId.has(destination.placeId)
        ) {
          byPlaceId.set(
            destination.placeId,
            destination
          );
        }
      }
    );
  });

  return [...byPlaceId.values()];
};


const accessTableMissing = (error) =>
  error?.code === "ER_NO_SUCH_TABLE" ||
  error?.errno === 1146;


const sourceCoordinatesMatch = (
  row,
  destination
) => {
  if (row.source_type === "manual") {
    return true;
  }

  return (
    Math.abs(
      Number(row.source_lat) -
        Number(destination.lat)
    ) < 0.0000002 &&
    Math.abs(
      Number(row.source_lng) -
        Number(destination.lng)
    ) < 0.0000002
  );
};


const loadAccessCache = async ({
  destinations,
  provider,
  profile,
}) => {
  if (!destinations.length) {
    return {
      available: true,
      rows: new Map(),
    };
  }

  const ids = destinations.map(
    (destination) => destination.placeId
  );

  const placeholders = ids
    .map(() => "?")
    .join(",");

  try {
    const [rows] = await pool.query(
      `
      SELECT
        explore_place_id,
        provider_name,
        transport_profile,
        source_lat,
        source_lng,
        routing_lat,
        routing_lng,
        snapped_distance_meters,
        source_type,
        resolution_strategy,
        verified_at,
        expires_at,
        last_used_at,
        updated_at
      FROM ${ROUTING_ACCESS_TABLE}
      WHERE
        explore_place_id IN (${placeholders})
        AND provider_name = ?
        AND transport_profile = ?
      `,
      [
        ...ids,
        provider,
        profile,
      ]
    );

    const result = new Map();

    rows.forEach((row) => {
      result.set(
        Number(row.explore_place_id),
        row
      );
    });

    return {
      available: true,
      rows: result,
    };
  } catch (error) {
    if (accessTableMissing(error)) {
      console.warn(
        `${ROUTING_ACCESS_TABLE} is not installed yet. Routing will continue without persistent access-point caching.`
      );

      return {
        available: false,
        rows: new Map(),
      };
    }

    throw error;
  }
};


const touchAccessRows = async (placeIds) => {
  if (!placeIds.length) {
    return;
  }

  const placeholders = placeIds
    .map(() => "?")
    .join(",");

  try {
    await pool.query(
      `
      UPDATE ${ROUTING_ACCESS_TABLE}
      SET last_used_at = NOW()
      WHERE explore_place_id IN (${placeholders})
      `,
      placeIds
    );
  } catch (error) {
    if (!accessTableMissing(error)) {
      throw error;
    }
  }
};


const saveAccessPoints = async ({
  destinations,
  provider,
  profile,
  cacheHours,
  strategyVersion,
}) => {
  const rows = destinations.filter(
    (destination) =>
      destination.placeId &&
      coordinateIsValid(
        destination.routingLat,
        destination.routingLng
      ) &&
      destination.routingAccessSourceType !==
        "manual"
  );

  if (!rows.length) {
    return;
  }

  const expiresAt = new Date(
    Date.now() +
      Number(cacheHours) * 60 * 60 * 1000
  );

  const placeholders = rows
    .map(
      () => `(
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        NOW(), ?, NOW()
      )`
    )
    .join(",");

  const values = [];

  rows.forEach((destination) => {
    values.push(
      destination.placeId,
      provider,
      profile,
      destination.lat,
      destination.lng,
      destination.routingLat,
      destination.routingLng,
      destination.routingAccessDistanceMeters,
      destination.routingAccessSourceType ||
        "provider_snap",
      strategyVersion,
      expiresAt
    );
  });

  try {
    await pool.query(
      `
      INSERT INTO ${ROUTING_ACCESS_TABLE}
      (
        explore_place_id,
        provider_name,
        transport_profile,
        source_lat,
        source_lng,
        routing_lat,
        routing_lng,
        snapped_distance_meters,
        source_type,
        resolution_strategy,
        verified_at,
        expires_at,
        last_used_at
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        source_lat =
          IF(
            source_type = 'manual',
            source_lat,
            VALUES(source_lat)
          ),
        source_lng =
          IF(
            source_type = 'manual',
            source_lng,
            VALUES(source_lng)
          ),
        routing_lat =
          IF(
            source_type = 'manual',
            routing_lat,
            VALUES(routing_lat)
          ),
        routing_lng =
          IF(
            source_type = 'manual',
            routing_lng,
            VALUES(routing_lng)
          ),
        snapped_distance_meters =
          IF(
            source_type = 'manual',
            snapped_distance_meters,
            VALUES(snapped_distance_meters)
          ),
        resolution_strategy =
          IF(
            source_type = 'manual',
            resolution_strategy,
            VALUES(resolution_strategy)
          ),
        verified_at =
          IF(
            source_type = 'manual',
            verified_at,
            NOW()
          ),
        expires_at =
          IF(
            source_type = 'manual',
            expires_at,
            VALUES(expires_at)
          ),
        source_type =
          IF(
            source_type = 'manual',
            source_type,
            VALUES(source_type)
          ),
        last_used_at = NOW()
      `,
      values
    );
  } catch (error) {
    if (accessTableMissing(error)) {
      return;
    }

    throw error;
  }
};


const cacheRowIsFresh = (row) => {
  if (row.source_type === "manual") {
    return true;
  }

  if (!row.expires_at) {
    return true;
  }

  const timestamp = new Date(
    row.expires_at
  ).getTime();

  return (
    Number.isFinite(timestamp) &&
    timestamp > Date.now()
  );
};


const applyCacheRow = (
  destination,
  row,
  stale = false
) => {
  setRoutingAccess(destination, {
    lat: row.routing_lat,
    lng: row.routing_lng,
    distanceMeters:
      row.snapped_distance_meters,
    sourceType:
      row.source_type || "provider_snap",
    stale,
  });
};


const matrixValueFinite = (value) =>
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value));


const getConnectivity = async ({
  destinations,
  routingProvider,
  transportProfile,
}) => {
  if (destinations.length <= 1) {
    return {
      components: [[0]],
    };
  }

  const locations = destinations.map(
    (destination) => [
      getRoutingLng(destination),
      getRoutingLat(destination),
    ]
  );

  const remaining = new Set(
    destinations.map((_, index) => index)
  );

  const components = [];

  while (remaining.size) {
    const seed = remaining.values().next().value;
    const candidateIndexes = [...remaining];

    const forward = await getMatrix({
      baseUrl: routingProvider.baseUrl,
      profile:
        transportProfile.providerProfile,
      locations,
      sources: [seed],
      destinations: candidateIndexes,
      timeoutMs:
        routingProvider.requestTimeoutMs,
    });

    const reverse = await getMatrix({
      baseUrl: routingProvider.baseUrl,
      profile:
        transportProfile.providerProfile,
      locations,
      sources: candidateIndexes,
      destinations: [seed],
      timeoutMs:
        routingProvider.requestTimeoutMs,
    });

    if (
      !Array.isArray(forward?.durations) ||
      !Array.isArray(reverse?.durations)
    ) {
      throw new Error(
        "Routing provider returned incomplete connectivity data."
      );
    }

    const component = [];

    candidateIndexes.forEach(
      (candidateIndex, localIndex) => {
        const forwardValue =
          forward.durations?.[0]?.[localIndex];
        const reverseValue =
          reverse.durations?.[localIndex]?.[0];

        if (
          matrixValueFinite(forwardValue) &&
          matrixValueFinite(reverseValue)
        ) {
          component.push(candidateIndex);
        }
      }
    );

    /*
      A matrix should always return 0 for seed -> seed.
      Keep a safety fallback so a provider quirk cannot create
      an endless loop.
    */
    if (!component.length) {
      component.push(seed);
    }

    component.forEach((index) => {
      remaining.delete(index);
    });

    components.push(component);
  }

  const componentAdjustment = (component) =>
    component.reduce(
      (total, index) => {
        const destination =
          destinations[index];

        return (
          total +
          haversineMeters(
            destination.lat,
            destination.lng,
            getRoutingLat(destination),
            getRoutingLng(destination)
          )
        );
      },
      0
    );


  components.sort(
    (a, b) =>
      b.length - a.length ||
      componentAdjustment(a) -
        componentAdjustment(b)
  );

  return {
    components,
  };
};

const coordinateKey = (coordinate) =>
  `${Number(coordinate[0]).toFixed(6)}|${Number(
    coordinate[1]
  ).toFixed(6)}`;


const generateSearchCoordinates = ({
  destination,
  searchRingKm,
  searchBearings,
}) => {
  const coordinates = [];

  searchRingKm.forEach((distanceKm) => {
    for (
      let index = 0;
      index < searchBearings;
      index += 1
    ) {
      coordinates.push(
        destinationPoint({
          lat: destination.lat,
          lng: destination.lng,
          distanceKm,
          bearingDegrees:
            (360 / searchBearings) * index,
        })
      );
    }
  });

  return coordinates;
};


const findConnectedAccessPoint = async ({
  destination,
  anchor,
  routingProvider,
  transportProfile,
  config,
}) => {
  const generated =
    generateSearchCoordinates({
      destination,
      searchRingKm:
        config.searchRingKm,
      searchBearings:
        config.searchBearings,
    });

  const snapped =
    await snapLocationsProgressively({
      baseUrl: routingProvider.baseUrl,
      profile:
        transportProfile.providerProfile,
      locations: generated,
      radii: [
        config.candidateSnapRadiusMeters,
      ],
      timeoutMs:
        routingProvider.requestTimeoutMs,
    });

  const candidates = [];
  const seen = new Set();

  const addCandidate = (coordinate) => {
    if (!coordinate) {
      return;
    }

    const key = coordinateKey(coordinate);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push(coordinate);
  };

  if (
    coordinateIsValid(
      destination.routingLat,
      destination.routingLng
    )
  ) {
    addCandidate([
      destination.routingLng,
      destination.routingLat,
    ]);
  }

  snapped.forEach((row) => {
    addCandidate(row?.coordinate);
  });

  if (!candidates.length) {
    return null;
  }

  /*
    Use one-to-many + many-to-one matrices rather than a
    square candidate matrix. This keeps the request small and
    remains comfortably inside the hosted Matrix route limit.
  */
  const safeCandidates = candidates.slice(0, 120);

  const locations = [
    [
      getRoutingLng(anchor),
      getRoutingLat(anchor),
    ],
    ...safeCandidates,
  ];

  const candidateIndexes = safeCandidates.map(
    (_, index) => index + 1
  );

  const forwardMatrix = await getMatrix({
    baseUrl: routingProvider.baseUrl,
    profile:
      transportProfile.providerProfile,
    locations,
    sources: [0],
    destinations: candidateIndexes,
    timeoutMs:
      routingProvider.requestTimeoutMs,
  });

  const reverseMatrix = await getMatrix({
    baseUrl: routingProvider.baseUrl,
    profile:
      transportProfile.providerProfile,
    locations,
    sources: candidateIndexes,
    destinations: [0],
    timeoutMs:
      routingProvider.requestTimeoutMs,
  });

  if (
    !Array.isArray(forwardMatrix?.durations) ||
    !Array.isArray(reverseMatrix?.durations)
  ) {
    return null;
  }

  let best = null;

  safeCandidates.forEach(
    (coordinate, index) => {
      const forward =
        forwardMatrix.durations?.[0]?.[index];
      const reverse =
        reverseMatrix.durations?.[index]?.[0];

      if (
        !matrixValueFinite(forward) ||
        !matrixValueFinite(reverse)
      ) {
        return;
      }

      const displacementMeters =
        haversineMeters(
          destination.lat,
          destination.lng,
          coordinate[1],
          coordinate[0]
        );

      const roundTripSeconds =
        Number(forward) + Number(reverse);

      if (
        !best ||
        displacementMeters <
          best.displacementMeters ||
        (
          Math.abs(
            displacementMeters -
              best.displacementMeters
          ) < 1 &&
          roundTripSeconds <
            best.roundTripSeconds
        )
      ) {
        best = {
          coordinate,
          displacementMeters,
          roundTripSeconds,
        };
      }
    }
  );

  return best;
};


const buildAccessWarnings = ({
  destinations,
  warningThresholdMeters,
  staleFallbackUsed,
}) => {
  const warnings = [];

  const adjusted = destinations
    .map((destination) => {
      const distanceMeters =
        haversineMeters(
          destination.lat,
          destination.lng,
          getRoutingLat(destination),
          getRoutingLng(destination)
        );

      return {
        destination,
        distanceMeters,
      };
    })
    .filter(
      (item) =>
        item.distanceMeters >=
        warningThresholdMeters
    )
    .sort(
      (a, b) =>
        b.distanceMeters -
        a.distanceMeters
    );

  if (adjusted.length) {
    const names = adjusted
      .slice(0, 3)
      .map(
        (item) =>
          item.destination.name ||
          `Place ${item.destination.placeId}`
      );

    const remaining =
      adjusted.length - names.length;

    const maxDistance =
      adjusted[0].distanceMeters;

    const distanceLabel =
      maxDistance >= 1000
        ? `${(maxDistance / 1000).toFixed(1)} km`
        : `${Math.round(maxDistance)} m`;

    warnings.push(
      `Road routing uses nearby drivable access points for ${names.join(
        ", "
      )}${
        remaining > 0
          ? ` and ${remaining} more`
          : ""
      }. The largest access-point adjustment is about ${distanceLabel}; map markers remain at the original destinations.`
    );
  }

  if (staleFallbackUsed) {
    warnings.push(
      "The live routing provider was temporarily unavailable while checking road-access points, so matching previously verified access points were reused."
    );
  }

  return {
    warnings,
    adjustedCount: adjusted.length,
    maxAdjustmentMeters:
      adjusted[0]?.distanceMeters || 0,
  };
};


/* =========================================================
   MAIN RESOLVER
========================================================= */

const resolveTripRoutingAccess = async ({
  days,
  routingProvider,
  transportProfile,
}) => {
  const destinations =
    uniqueDestinationsFromDays(days);

  if (!destinations.length) {
    return {
      warnings: [],
      adjustedCount: 0,
      maxAdjustmentMeters: 0,
      cacheAvailable: true,
      staleFallbackUsed: false,
      strategyVersion: "road-access-v2",
    };
  }

  destinations.forEach((destination) => {
    setRoutingAccess(destination, {
      lat: destination.lat,
      lng: destination.lng,
      distanceMeters: 0,
      sourceType: "original",
    });
  });

  const config = getAccessConfig(
    routingProvider
  );

  if (!config.enabled) {
    return {
      warnings: [],
      adjustedCount: 0,
      maxAdjustmentMeters: 0,
      cacheAvailable: true,
      staleFallbackUsed: false,
      strategyVersion:
        config.strategyVersion,
    };
  }

  const provider = routingProvider.key;
  const profile =
    transportProfile.providerProfile;

  const cacheResult =
    await loadAccessCache({
      destinations,
      provider,
      profile,
    });

  const freshUsedIds = [];
  const staleRows = new Map();
  const unresolved = [];

  destinations.forEach((destination) => {
    const row = cacheResult.rows.get(
      Number(destination.placeId)
    );

    if (
      !row ||
      !sourceCoordinatesMatch(
        row,
        destination
      ) ||
      !coordinateIsValid(
        row.routing_lat,
        row.routing_lng
      )
    ) {
      unresolved.push(destination);
      return;
    }

    if (cacheRowIsFresh(row)) {
      applyCacheRow(
        destination,
        row,
        false
      );
      freshUsedIds.push(
        destination.placeId
      );
      return;
    }

    staleRows.set(
      Number(destination.placeId),
      row
    );
    unresolved.push(destination);
  });

  if (freshUsedIds.length) {
    await touchAccessRows(freshUsedIds);
  }

  if (!unresolved.length) {
    const warningData =
      buildAccessWarnings({
        destinations,
        warningThresholdMeters:
          config.warningThresholdMeters,
        staleFallbackUsed: false,
      });

    return {
      ...warningData,
      cacheAvailable:
        cacheResult.available,
      staleFallbackUsed: false,
      strategyVersion:
        config.strategyVersion,
    };
  }

  let staleFallbackUsed = false;
  const newOrRefreshed = new Set(
    unresolved.map(
      (destination) =>
        Number(destination.placeId)
    )
  );

  try {
    const snapped =
      await snapLocationsProgressively({
        baseUrl: routingProvider.baseUrl,
        profile,
        locations: unresolved.map(
          (destination) => [
            destination.lng,
            destination.lat,
          ]
        ),
        radii: config.snapRadiiMeters,
        timeoutMs:
          routingProvider.requestTimeoutMs,
      });

    unresolved.forEach(
      (destination, index) => {
        const row = snapped[index];

        if (!row) {
          return;
        }

        const displacementMeters =
          haversineMeters(
            destination.lat,
            destination.lng,
            row.coordinate[1],
            row.coordinate[0]
          );

        setRoutingAccess(destination, {
          lat: row.coordinate[1],
          lng: row.coordinate[0],
          distanceMeters:
            displacementMeters,
          sourceType: "provider_snap",
        });
      }
    );
  } catch (error) {
    if (
      !isRoutingProviderRetryableError(error)
    ) {
      throw error;
    }

    const missingStale = unresolved.filter(
      (destination) =>
        !staleRows.has(
          Number(destination.placeId)
        )
    );

    if (missingStale.length) {
      throw error;
    }

    unresolved.forEach((destination) => {
      applyCacheRow(
        destination,
        staleRows.get(
          Number(destination.placeId)
        ),
        true
      );
    });

    staleFallbackUsed = true;
  }

  /*
    Fresh/stale cached access points were already verified
    during an earlier successful analysis. New/changed points
    must be checked against the connected road graph before
    they are stored.
  */
  if (!staleFallbackUsed) {
    let connectivity =
      await getConnectivity({
        destinations,
        routingProvider,
        transportProfile,
      });

    let mainComponent =
      connectivity.components[0] || [];

    if (
      mainComponent.length <
      destinations.length
    ) {
      const mainSet = new Set(
        mainComponent
      );

      const anchorIndex =
        mainComponent[0] ?? 0;
      const anchor =
        destinations[anchorIndex];

      const disconnectedIndexes =
        destinations
          .map((_, index) => index)
          .filter(
            (index) => !mainSet.has(index)
          );

      const unresolvedNames = [];

      for (const index of disconnectedIndexes) {
        const destination =
          destinations[index];

        let replacement = null;

        try {
          replacement =
            await findConnectedAccessPoint({
              destination,
              anchor,
              routingProvider,
              transportProfile,
              config,
            });
        } catch (error) {
          if (
            isRoutingProviderRetryableError(
              error
            )
          ) {
            throw error;
          }

          console.warn(
            `Could not search a connected access point for ${destination.name || destination.placeId}:`,
            error.message
          );
        }

        if (!replacement) {
          unresolvedNames.push(
            destination.name ||
              `Place ${destination.placeId}`
          );
          continue;
        }

        setRoutingAccess(destination, {
          lat: replacement.coordinate[1],
          lng: replacement.coordinate[0],
          distanceMeters:
            replacement.displacementMeters,
          sourceType: "connected_search",
        });

        newOrRefreshed.add(
          Number(destination.placeId)
        );
      }

      connectivity =
        await getConnectivity({
          destinations,
          routingProvider,
          transportProfile,
        });

      mainComponent =
        connectivity.components[0] || [];

      if (
        mainComponent.length <
        destinations.length
      ) {
        const connectedSet = new Set(
          mainComponent
        );

        const remaining = destinations
          .map((destination, index) => ({
            destination,
            index,
          }))
          .filter(
            ({ index }) =>
              !connectedSet.has(index)
          )
          .map(
            ({ destination }) =>
              destination.name ||
              `Place ${destination.placeId}`
          );

        const names = [
          ...new Set([
            ...unresolvedNames,
            ...remaining,
          ]),
        ];

        throw new RoutingAccessResolutionError(
          "TourismHub could not find a connected drivable access point for one or more destinations.",
          {
            destinations: names,
          }
        );
      }
    }

    /*
      Only save provider-derived points after the complete set
      has been verified to share one connected road graph.
    */
    await saveAccessPoints({
      destinations: destinations.filter(
        (destination) =>
          newOrRefreshed.has(
            Number(destination.placeId)
          )
      ),
      provider,
      profile,
      cacheHours: config.cacheHours,
      strategyVersion:
        config.strategyVersion,
    });
  }

  const warningData = buildAccessWarnings({
    destinations,
    warningThresholdMeters:
      config.warningThresholdMeters,
    staleFallbackUsed,
  });

  return {
    ...warningData,
    cacheAvailable: cacheResult.available,
    staleFallbackUsed,
    strategyVersion:
      config.strategyVersion,
  };
};


module.exports = {
  resolveTripRoutingAccess,
  getRoutingLat,
  getRoutingLng,
  RoutingAccessResolutionError,
  isRoutingAccessResolutionError,
};
