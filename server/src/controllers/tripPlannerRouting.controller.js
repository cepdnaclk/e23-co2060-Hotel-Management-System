const crypto =
  require("crypto");

const pool =
  require("../config/db");

const {
  getDirectionsBatched,
  getMatrix,
  isRoutingProviderRetryableError,
  isRoutingProviderUnroutableError,
} = require(
  "../utils/routingClient"
);

const {
  optimizeDayOrder,
  orderChanged,
} = require(
  "../utils/routeOptimizer"
);

const {
  resolveTripRoutingAccess,
  getRoutingLat,
  getRoutingLng,
  RoutingAccessResolutionError,
  isRoutingAccessResolutionError,
} = require(
  "../utils/routingAccessResolver"
);


const GUEST_COOKIE_NAME =
  "tourismhub_guest_id";


/* =========================================================
   HELPERS
========================================================= */

const parseJson = (
  value,
  fallback = null
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }


  if (
    typeof value ===
      "object"
  ) {
    return value;
  }


  try {
    return JSON.parse(
      value
    );
  } catch {
    return fallback;
  }
};


const parseCookies = (
  req
) => {
  const header =
    req.headers.cookie ||
    "";


  return header
    .split(";")
    .reduce(
      (
        result,
        cookie
      ) => {
        const [
          key,
          ...parts
        ] =
          cookie
            .trim()
            .split("=");


        if (key) {
          result[key] =
            decodeURIComponent(
              parts.join("=")
            );
        }


        return result;
      },
      {}
    );
};


const getOwner = (
  req
) => {
  if (req.user) {
    if (
      req.user.role !==
      "tourist"
    ) {
      return {
        error:
          "Only tourists or guest users can analyze trip plans.",
      };
    }


    return {
      userId:
        req.user.id,

      guestSessionId:
        null,
    };
  }


  const cookies =
    parseCookies(req);


  return {
    userId:
      null,

    guestSessionId:
      cookies[
        GUEST_COOKIE_NAME
      ] || null,
  };
};


const getOwnership = (
  owner
) => {
  if (owner.userId) {
    return {
      sql:
        "tp.user_id = ?",

      params: [
        owner.userId,
      ],
    };
  }


  if (
    owner.guestSessionId
  ) {
    return {
      sql:
        "tp.guest_session_id = ?",

      params: [
        owner.guestSessionId,
      ],
    };
  }


  return null;
};


const getPlannerSettings =
  async () => {
    const [rows] =
      await pool.query(
        `
        SELECT
          setting_key,
          setting_value

        FROM explore_settings

        WHERE setting_key IN (
          'trip_planner_config',
          'trip_planner_transport_profiles',
          'trip_planner_optimization_modes',
          'trip_planner_routing_provider'
        )
        `
      );


    const settings = {};


    rows.forEach((row) => {
      settings[
        row.setting_key
      ] =
        parseJson(
          row.setting_value,
          null
        );
    });


    return settings;
  };


const coordinateIsValid = (
  lat,
  lng
) => {
  return (
    Number.isFinite(
      Number(lat)
    ) &&
    Number.isFinite(
      Number(lng)
    )
  );
};


const buildCacheKey = ({
  provider,
  profile,
  origin,
  destination,
}) => {
  const raw = [
    provider,
    profile,
    "matrix",
    origin.placeId,
    getRoutingLat(
      origin
    ).toFixed(7),
    getRoutingLng(
      origin
    ).toFixed(7),
    destination.placeId,
    getRoutingLat(
      destination
    ).toFixed(7),
    getRoutingLng(
      destination
    ).toFixed(7),
  ].join("|");


  return crypto
    .createHash(
      "sha256"
    )
    .update(raw)
    .digest("hex");
};


/* =========================================================
   LOAD SAVED TRIP
========================================================= */

const loadTripForRouting =
  async (
    tripPlanId,
    ownership
  ) => {
    const [plans] =
      await pool.query(
        `
        SELECT
          tp.id,
          tp.title,

          tp.transport_profile,
          tp.optimization_mode

        FROM trip_plans tp

        WHERE
          tp.id = ?
          AND ${ownership.sql}

        LIMIT 1
        `,
        [
          tripPlanId,
          ...ownership.params,
        ]
      );


    if (!plans.length) {
      return null;
    }


    const [dayRows] =
      await pool.query(
        `
        SELECT
          tpd.id,
          tpd.day_number,

          DATE_FORMAT(
            tpd.trip_date,
            '%Y-%m-%d'
          ) AS trip_date,

          tpd.notes,

          tpd.is_locked,
          tpd.lock_reason,

          EXISTS (
            SELECT 1
            FROM trip_plan_items fixed_item
            WHERE
              fixed_item.trip_day_id =
                tpd.id
              AND fixed_item.is_fixed =
                TRUE
          ) AS has_fixed_item

        FROM trip_plan_days tpd

        WHERE
          tpd.trip_plan_id = ?

        ORDER BY
          tpd.day_number ASC,
          tpd.id ASC
        `,
        [
          tripPlanId,
        ]
      );


    const [
      destinationRows,
    ] =
      await pool.query(
        `
        SELECT
          tpi.trip_day_id,

          tpi.id
            AS trip_item_id,

          tpi.explore_place_id,

          tpi.sort_order,

          ep.name,
          ep.city,
          ep.district,

          ep.lat,
          ep.lng

        FROM trip_plan_items tpi

        INNER JOIN
          trip_plan_days tpd
          ON tpd.id =
             tpi.trip_day_id

        LEFT JOIN
          explore_places ep
          ON ep.id =
             tpi.explore_place_id

        WHERE
          tpd.trip_plan_id = ?

          AND tpi.item_type =
              'destination'

        ORDER BY
          tpd.day_number ASC,
          tpi.sort_order ASC,
          tpi.id ASC
        `,
        [
          tripPlanId,
        ]
      );


    const destinationsByDay =
      new Map();


    destinationRows.forEach(
      (row) => {
        if (
          !destinationsByDay.has(
            row.trip_day_id
          )
        ) {
          destinationsByDay.set(
            row.trip_day_id,
            []
          );
        }


        destinationsByDay
          .get(
            row.trip_day_id
          )
          .push({
            tripItemId:
              row.trip_item_id,

            placeId:
              row.explore_place_id,

            sortOrder:
              Number(
                row.sort_order ||
                  0
              ),

            name:
              row.name,

            city:
              row.city,

            district:
              row.district,

            lat:
              row.lat === null
                ? null
                : Number(
                    row.lat
                  ),

            lng:
              row.lng === null
                ? null
                : Number(
                    row.lng
                  ),
          });
      }
    );


    const days =
      dayRows.map(
        (
          day,
          index
        ) => {
          const destinations =
            destinationsByDay.get(
              day.id
            ) || [];


          const validDestinations =
            destinations.filter(
              (destination) =>
                destination.placeId &&
                coordinateIsValid(
                  destination.lat,
                  destination.lng
                )
            );


          /*
            First day remains the
            trip starting anchor.

            Fixed bookings/events
            also prevent day movement.
          */
          const locked =
            index === 0 ||
            Boolean(
              day.is_locked
            ) ||
            Boolean(
              day.has_fixed_item
            );


          return {
            dayId:
              day.id,

            dayNumber:
              Number(
                day.day_number
              ),

            date:
              day.trip_date,

            notes:
              day.notes,

            locked,

            databaseLocked:
              Boolean(
                day.is_locked
              ),

            containsFixedItem:
              Boolean(
                day.has_fixed_item
              ),

            lockReason:
              day.lock_reason,

            destinations,

            validDestinations,

            routable:
              validDestinations.length >
              0,

            entry:
              validDestinations[0] ||
              null,

            exit:
              validDestinations[
                validDestinations.length -
                  1
              ] || null,
          };
        }
      );


    return {
      plan:
        plans[0],

      days,
    };
  };


/* =========================================================
   INPUT VALIDATION
========================================================= */

const validateRoutingData = (
  days
) => {
  const problems = [];


  days.forEach((day) => {
    day.destinations.forEach(
      (destination) => {
        if (
          !destination.placeId
        ) {
          problems.push({
            dayId:
              day.dayId,

            dayNumber:
              day.dayNumber,

            message:
              "A saved destination no longer exists in explore_places.",
          });

          return;
        }


        if (
          !coordinateIsValid(
            destination.lat,
            destination.lng
          )
        ) {
          problems.push({
            dayId:
              day.dayId,

            dayNumber:
              day.dayNumber,

            placeId:
              destination.placeId,

            name:
              destination.name,

            message:
              "Destination does not have valid coordinates.",
          });
        }
      }
    );
  });


  return problems;
};


/* =========================================================
   LOAD ROUTE CACHE

   By default only fresh rows are used.

   During a temporary routing-provider
   outage, allowExpired=true can load an
   older route pair as a safe fallback.

   Cache keys already include:
   - provider
   - transport profile
   - origin/destination IDs
   - exact coordinates
========================================================= */

const loadCachedPairs =
  async (
    pairDefinitions,
    {
      allowExpired = false,
    } = {}
  ) => {
    if (
      pairDefinitions.length ===
      0
    ) {
      return new Map();
    }


    const keys =
      pairDefinitions.map(
        (pair) =>
          pair.cacheKey
      );


    const placeholders =
      keys
        .map(() => "?")
        .join(",");


    const expiryFilter =
      allowExpired
        ? ""
        : `
          AND (
            expires_at IS NULL
            OR expires_at > NOW()
          )
        `;


    const [rows] =
      await pool.query(
        `
        SELECT
          cache_key,
          distance_meters,
          duration_seconds,
          expires_at,
          updated_at

        FROM trip_route_cache

        WHERE
          cache_key IN (
            ${placeholders}
          )

          ${expiryFilter}
        `,
        keys
      );


    const cache =
      new Map();


    const now =
      Date.now();


    rows.forEach((row) => {
      const expiresAt =
        row.expires_at
          ? new Date(
              row.expires_at
            ).getTime()
          : null;


      cache.set(
        row.cache_key,
        {
          distanceMeters:
            row.distance_meters ===
            null
              ? null
              : Number(
                  row.distance_meters
                ),

          durationSeconds:
            row.duration_seconds ===
            null
              ? null
              : Number(
                  row.duration_seconds
                ),

          stale:
            expiresAt !== null &&
            Number.isFinite(
              expiresAt
            ) &&
            expiresAt <= now,

          expiresAt:
            row.expires_at ||
            null,

          updatedAt:
            row.updated_at ||
            null,
        }
      );
    });


    if (rows.length) {
      const foundKeys =
        rows.map(
          (row) =>
            row.cache_key
        );


      const foundPlaceholders =
        foundKeys
          .map(() => "?")
          .join(",");


      await pool.query(
        `
        UPDATE
          trip_route_cache

        SET
          last_used_at = NOW()

        WHERE
          cache_key IN (
            ${foundPlaceholders}
          )
        `,
        foundKeys
      );
    }


    return cache;
  };


/* =========================================================
   SAVE MATRIX RESULTS INTO CACHE
========================================================= *//* =========================================================
   SAVE MATRIX RESULTS INTO CACHE
========================================================= */

const saveMatrixPairs =
  async ({
    pairDefinitions,
    distanceMatrix,
    durationMatrix,
    provider,
    profile,
    cacheHours,
  }) => {
    const rows = [];


    pairDefinitions.forEach(
      (pair) => {
        const distance =
          distanceMatrix?.[
            pair.sourceIndex
          ]?.[
            pair.destinationIndex
          ];


        const duration =
          durationMatrix?.[
            pair.sourceIndex
          ]?.[
            pair.destinationIndex
          ];


        if (
          distance ===
            null ||
          distance ===
            undefined ||
          duration ===
            null ||
          duration ===
            undefined
        ) {
          return;
        }


        if (
          !Number.isFinite(
            Number(
              distance
            )
          ) ||
          !Number.isFinite(
            Number(
              duration
            )
          )
        ) {
          return;
        }


        rows.push({
          ...pair,

          distanceMeters:
            Number(
              distance
            ),

          durationSeconds:
            Number(
              duration
            ),
        });
      }
    );


    if (!rows.length) {
      return;
    }


    const expiresAt =
      new Date(
        Date.now() +
          Number(
            cacheHours
          ) *
            60 *
            60 *
            1000
      );


    const placeholders =
      rows
        .map(
          () =>
            `
            (
              ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?,
              ?, ?,
              ?,
              NOW()
            )
            `
        )
        .join(",");


    const values = [];


    rows.forEach((row) => {
      values.push(
        row.cacheKey,

        row.origin.placeId,

        row.destination.placeId,

        getRoutingLat(
          row.origin
        ),

        getRoutingLng(
          row.origin
        ),

        getRoutingLat(
          row.destination
        ),

        getRoutingLng(
          row.destination
        ),

        provider,

        profile,

        row.distanceMeters,

        row.durationSeconds,

        expiresAt
      );
    });


    await pool.query(
      `
      INSERT INTO
        trip_route_cache
      (
        cache_key,

        origin_place_id,
        destination_place_id,

        origin_lat,
        origin_lng,

        destination_lat,
        destination_lng,

        provider_name,
        transport_profile,

        distance_meters,
        duration_seconds,

        expires_at,
        last_used_at
      )

      VALUES
        ${placeholders}

      ON DUPLICATE KEY UPDATE

        distance_meters =
          VALUES(
            distance_meters
          ),

        duration_seconds =
          VALUES(
            duration_seconds
          ),

        expires_at =
          VALUES(
            expires_at
          ),

        last_used_at =
          NOW()
      `,
      values
    );
  };


/* =========================================================
   CREATE DAY-TO-DAY MATRIX

   Normal flow:
   1. use fresh MySQL pair cache
   2. fetch missing pairs from provider
   3. store fresh provider data

   Temporary provider outage:
   - after routingClient retries are
     exhausted, use matching expired
     MySQL pair-cache rows when every
     required pair is available.

   No straight-line / guessed distance
   is ever invented.
========================================================= */

const buildDayMatrices =
  async ({
    routableDays,
    routingProvider,
    transportProfile,
    cacheHours,
  }) => {
    const count =
      routableDays.length;


    routableDays.forEach(
      (day, index) => {
        day.matrixIndex =
          index;
      }
    );


    const pairDefinitions =
      [];


    for (
      let source = 0;
      source < count;
      source += 1
    ) {
      for (
        let destination = 0;
        destination < count;
        destination += 1
      ) {
        const origin =
          routableDays[
            source
          ].exit;


        const target =
          routableDays[
            destination
          ].entry;


        pairDefinitions.push({
          sourceIndex:
            source,

          destinationIndex:
            destination,

          origin,

          destination:
            target,

          cacheKey:
            buildCacheKey({
              provider:
                routingProvider.key,

              profile:
                transportProfile
                  .providerProfile,

              origin,

              destination:
                target,
            }),
        });
      }
    }


    let cache =
      await loadCachedPairs(
        pairDefinitions
      );


    const missing =
      pairDefinitions.filter(
        (pair) =>
          !cache.has(
            pair.cacheKey
          )
      );


    let providerCalled =
      false;

    let staleFallbackUsed =
      false;

    let stalePairCount =
      0;


    if (missing.length) {
      providerCalled =
        true;


      const exitLocations =
        routableDays.map(
          (day) => [
            getRoutingLng(
              day.exit
            ),
            getRoutingLat(
              day.exit
            ),
          ]
        );


      const entryLocations =
        routableDays.map(
          (day) => [
            getRoutingLng(
              day.entry
            ),
            getRoutingLat(
              day.entry
            ),
          ]
        );


      const locations = [
        ...exitLocations,
        ...entryLocations,
      ];


      const sources =
        routableDays.map(
          (_, index) =>
            index
        );


      const destinations =
        routableDays.map(
          (_, index) =>
            count + index
        );


      try {
        const matrix =
          await getMatrix({
            baseUrl:
              routingProvider
                .baseUrl,

            profile:
              transportProfile
                .providerProfile,

            locations,

            sources,

            destinations,

            timeoutMs:
              routingProvider
                .requestTimeoutMs,
          });


        if (
          !Array.isArray(
            matrix?.distances
          ) ||
          !Array.isArray(
            matrix?.durations
          )
        ) {
          throw new Error(
            "Routing provider returned an incomplete matrix."
          );
        }


        await saveMatrixPairs({
          pairDefinitions,

          distanceMatrix:
            matrix.distances,

          durationMatrix:
            matrix.durations,

          provider:
            routingProvider.key,

          profile:
            transportProfile
              .providerProfile,

          cacheHours,
        });


        cache =
          await loadCachedPairs(
            pairDefinitions
          );
      } catch (error) {
        if (
          !isRoutingProviderRetryableError(
            error
          )
        ) {
          throw error;
        }


        const staleCache =
          await loadCachedPairs(
            pairDefinitions,
            {
              allowExpired:
                true,
            }
          );


        const mergedCache =
          new Map(
            staleCache
          );


        cache.forEach(
          (
            value,
            key
          ) => {
            mergedCache.set(
              key,
              value
            );
          }
        );


        const completeFallback =
          pairDefinitions.every(
            (pair) => {
              const value =
                mergedCache.get(
                  pair.cacheKey
                );


              return (
                value &&
                Number.isFinite(
                  value.distanceMeters
                ) &&
                Number.isFinite(
                  value.durationSeconds
                )
              );
            }
          );


        if (
          !completeFallback
        ) {
          throw error;
        }


        cache =
          mergedCache;

        staleFallbackUsed =
          true;

        stalePairCount =
          pairDefinitions.filter(
            (pair) =>
              cache.get(
                pair.cacheKey
              )?.stale ===
              true
          ).length;


        console.warn(
          "Routing matrix provider unavailable. Using matching stale route-pair cache."
        );

        console.warn(
          "Stale pair count:",
          stalePairCount
        );
      }
    }


    const distanceMatrix =
      Array.from(
        {
          length:
            count,
        },
        () =>
          Array(
            count
          ).fill(
            Infinity
          )
      );


    const durationMatrix =
      Array.from(
        {
          length:
            count,
        },
        () =>
          Array(
            count
          ).fill(
            Infinity
          )
      );


    pairDefinitions.forEach(
      (pair) => {
        const cached =
          cache.get(
            pair.cacheKey
          );


        if (!cached) {
          return;
        }


        if (
          Number.isFinite(
            cached.distanceMeters
          )
        ) {
          distanceMatrix[
            pair.sourceIndex
          ][
            pair.destinationIndex
          ] =
            cached.distanceMeters;
        }


        if (
          Number.isFinite(
            cached.durationSeconds
          )
        ) {
          durationMatrix[
            pair.sourceIndex
          ][
            pair.destinationIndex
          ] =
            cached.durationSeconds;
        }
      }
    );


    const unavailablePairs =
      pairDefinitions.filter(
        (pair) => {
          const distance =
            distanceMatrix[
              pair.sourceIndex
            ][
              pair.destinationIndex
            ];

          const duration =
            durationMatrix[
              pair.sourceIndex
            ][
              pair.destinationIndex
            ];

          return (
            !Number.isFinite(
              Number(distance)
            ) ||
            !Number.isFinite(
              Number(duration)
            )
          );
        }
      );


    if (unavailablePairs.length) {
      const destinationNames = [
        ...new Set(
          unavailablePairs
            .flatMap(
              (pair) => [
                pair.origin?.name,
                pair.destination?.name,
              ]
            )
            .filter(Boolean)
        ),
      ];


      throw new RoutingAccessResolutionError(
        "The road-routing provider could not connect all planned destinations.",
        {
          destinations:
            destinationNames,
        }
      );
    }


    return {
      distanceMatrix,

      durationMatrix,

      providerCalled,

      pairCount:
        pairDefinitions.length,

      staleFallbackUsed,

      stalePairCount,
    };
  };


/* =========================================================
   ROUTE COORDINATES
========================================================= *//* =========================================================
   ROUTE COORDINATES
========================================================= */

const flattenCoordinates =
  (days) => {
    const coordinates = [];


    days.forEach((day) => {
      day.validDestinations.forEach(
        (destination) => {
          coordinates.push([
            getRoutingLng(
              destination
            ),
            getRoutingLat(
              destination
            ),
          ]);
        }
      );
    });


    return coordinates;
  };


/* =========================================================
   RESPONSE DAY FORMAT
========================================================= */

const serializeDay = (
  day
) => {
  return {
    dayId:
      day.dayId,

    dayNumber:
      day.dayNumber,

    date:
      day.date,

    locked:
      day.locked,

    databaseLocked:
      day.databaseLocked,

    containsFixedItem:
      day.containsFixedItem,

    lockReason:
      day.lockReason,

    destinations:
      day.validDestinations.map(
        (destination) => ({
          placeId:
            destination.placeId,

          name:
            destination.name,

          city:
            destination.city,

          district:
            destination.district,

          lat:
            destination.lat,

          lng:
            destination.lng,
        })
      ),
  };
};


/* =========================================================
   ROUTING STATE HASH

   Stable while route-relevant trip data
   stays the same.

   Cache age is checked separately using
   trip_route_analyses.created_at.

   This lets us:
   - reuse a fresh analysis normally
   - reuse the same older analysis only
     as an outage fallback
========================================================= */

const createInputHash = ({
  trip,
  days,
  provider,
  profile,
  optimizationMode,
}) => {
  const payload = {
    tripPlanId:
      trip.id,

    provider:
      provider.key,

    profile:
      profile.key,

    providerProfile:
      profile.providerProfile,

    optimizationMode:
      optimizationMode.key,

    providerPreference:
      optimizationMode
        .providerPreference ||
      null,

    metric:
      optimizationMode.metric,

    routingStrategyVersion:
      provider
        .routingStrategyVersion ||
      "road-access-v2",

    snapFallbackEnabled:
      provider
        .snapFallbackEnabled !==
      false,

    snapRadiiMeters:
      Array.isArray(
        provider.snapRadiiMeters
      )
        ? provider.snapRadiiMeters
        : null,

    accessSearchRingKm:
      Array.isArray(
        provider.accessSearchRingKm
      )
        ? provider.accessSearchRingKm
        : null,

    days:
      days.map(
        (day) => ({
          dayId:
            day.dayId,

          dayNumber:
            day.dayNumber,

          locked:
            day.locked,

          destinations:
            day.validDestinations.map(
              (
                destination
              ) => ({
                placeId:
                  destination.placeId,

                lat:
                  destination.lat,

                lng:
                  destination.lng,

                routingLat:
                  getRoutingLat(
                    destination
                  ),

                routingLng:
                  getRoutingLng(
                    destination
                  ),
              })
            ),
        })
      ),
  };


  return crypto
    .createHash(
      "sha256"
    )
    .update(
      JSON.stringify(
        payload
      )
    )
    .digest("hex");
};


/* =========================================================
   LOAD EXISTING ANALYSIS
========================================================= *//* =========================================================
   LOAD EXISTING ANALYSIS
========================================================= */

const getCachedAnalysis =
  async (
    tripPlanId,
    inputHash,
    {
      maxAgeHours = null,
    } = {}
  ) => {
    const hasMaxAge =
      Number.isFinite(
        Number(
          maxAgeHours
        )
      ) &&
      Number(
        maxAgeHours
      ) > 0;


    const ageFilter =
      hasMaxAge
        ? `
          AND created_at >=
            DATE_SUB(
              NOW(),
              INTERVAL ? HOUR
            )
        `
        : "";


    const params = [
      tripPlanId,
      inputHash,
    ];


    if (hasMaxAge) {
      params.push(
        Number(
          maxAgeHours
        )
      );
    }


    const [rows] =
      await pool.query(
        `
        SELECT
          id,

          provider_name,
          transport_profile,
          optimization_mode,

          current_distance_meters,
          current_duration_seconds,

          optimized_distance_meters,
          optimized_duration_seconds,

          current_order,
          optimized_order,

          route_geometry,

          created_at

        FROM trip_route_analyses

        WHERE
          trip_plan_id = ?
          AND input_hash = ?

          ${ageFilter}

        ORDER BY
          id DESC

        LIMIT 1
        `,
        params
      );


    return rows[0] ||
      null;
  };


/* =========================================================
   SERIALIZE SAVED ANALYSIS
========================================================= */

const buildSavedAnalysisData = ({
  analysis,
  days,
  optimizationMode,
  cached,
  staleFallbackUsed = false,
  warnings = [],
}) => {
  if (!analysis) {
    return null;
  }


  const currentOrderIds =
    parseJson(
      analysis.current_order,
      []
    );


  const optimizedOrderIds =
    parseJson(
      analysis.optimized_order,
      []
    );


  if (
    !Array.isArray(
      currentOrderIds
    ) ||
    !Array.isArray(
      optimizedOrderIds
    )
  ) {
    return null;
  }


  const dayMap =
    new Map(
      days.map(
        (day) => [
          day.dayId,
          day,
        ]
      )
    );


  const currentDays =
    currentOrderIds
      .map(
        (id) =>
          dayMap.get(
            Number(id)
          )
      )
      .filter(
        Boolean
      );


  const recommendedDays =
    optimizedOrderIds
      .map(
        (id) =>
          dayMap.get(
            Number(id)
          )
      )
      .filter(
        Boolean
      );


  if (
    currentDays.length !==
      days.length ||
    recommendedDays.length !==
      days.length
  ) {
    return null;
  }


  const geometry =
    parseJson(
      analysis.route_geometry,
      {}
    );


  const currentDistance =
    Number(
      analysis
        .current_distance_meters ||
        0
    );


  const currentDuration =
    Number(
      analysis
        .current_duration_seconds ||
        0
    );


  const optimizedDistance =
    Number(
      analysis
        .optimized_distance_meters ||
        0
    );


  const optimizedDuration =
    Number(
      analysis
        .optimized_duration_seconds ||
        0
    );


  const metricImproved =
    optimizationMode.metric ===
    "distance"
      ? optimizedDistance <
        currentDistance
      : optimizedDuration <
        currentDuration;


  return {
    analysisId:
      analysis.id,

    cached:
      Boolean(
        cached
      ),

    staleFallback:
      Boolean(
        staleFallbackUsed
      ),

    provider:
      analysis
        .provider_name,

    transportProfile:
      analysis
        .transport_profile,

    optimizationMode:
      analysis
        .optimization_mode,

    metric:
      optimizationMode.metric,

    improved:
      metricImproved,

    current: {
      order:
        currentDays.map(
          serializeDay
        ),

      distanceMeters:
        currentDistance,

      durationSeconds:
        currentDuration,

      geometry:
        geometry.current ||
        null,
    },

    recommended: {
      order:
        recommendedDays.map(
          serializeDay
        ),

      distanceMeters:
        optimizedDistance,

      durationSeconds:
        optimizedDuration,

      geometry:
        geometry.optimized ||
        null,
    },

    saving: {
      distanceMeters:
        Math.max(
          0,
          currentDistance -
            optimizedDistance
        ),

      durationSeconds:
        Math.max(
          0,
          currentDuration -
            optimizedDuration
        ),
    },

    warnings,
  };
};


/* =========================================================
   ANALYZE ROUTE
========================================================= */

const analyzeTripPlannerRoute =
  async (req, res) => {
    let fallbackContext =
      null;

    try {
      const tripPlanId =
        Number(
          req.body.tripPlanId
        );


      if (
        !Number.isInteger(
          tripPlanId
        ) ||
        tripPlanId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A valid tripPlanId is required.",
          });
      }


      const owner =
        getOwner(req);


      if (owner.error) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              owner.error,
          });
      }


      const ownership =
        getOwnership(
          owner
        );


      if (!ownership) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Trip plan not found.",
          });
      }


      const loaded =
        await loadTripForRouting(
          tripPlanId,
          ownership
        );


      if (!loaded) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Trip plan not found.",
          });
      }


      const {
        plan,
        days,
      } = loaded;


      const problems =
        validateRoutingData(
          days
        );


      if (problems.length) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "Trip contains destinations that cannot be routed.",

            problems,
          });
      }


      const routableDays =
        days.filter(
          (day) =>
            day.routable
        );


      if (
        routableDays.length <
        2
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "At least two trip days with destinations are required for route analysis.",
          });
      }


      const settings =
        await getPlannerSettings();


      const plannerConfig =
        settings
          .trip_planner_config;


      const routingProvider =
        settings
          .trip_planner_routing_provider;


      const transportProfiles =
        settings
          .trip_planner_transport_profiles;


      const optimizationModes =
        settings
          .trip_planner_optimization_modes;


      if (
        !plannerConfig ||
        !routingProvider ||
        !Array.isArray(
          transportProfiles
        ) ||
        !Array.isArray(
          optimizationModes
        )
      ) {
        throw new Error(
          "Trip Planner routing configuration is incomplete."
        );
      }


      if (
        routingProvider.enabled !==
        true
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "Trip routing is currently disabled.",
          });
      }


      const cacheHours =
        Number(
          plannerConfig
            .routeCacheHours
        );


      if (
        !Number.isFinite(
          cacheHours
        ) ||
        cacheHours <= 0
      ) {
        throw new Error(
          "trip_planner_config.routeCacheHours must be a positive number."
        );
      }


      const transportProfile =
        transportProfiles.find(
          (profile) =>
            profile.key ===
            plan.transport_profile
        );


      if (
        !transportProfile ||
        !transportProfile
          .providerProfile
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "Saved trip transport profile is not available.",
          });
      }


      const optimizationMode =
        optimizationModes.find(
          (mode) =>
            mode.key ===
            plan.optimization_mode
        );


      if (
        !optimizationMode
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "Saved trip optimization mode is not available.",
          });
      }


      if (
        optimizationMode.metric !==
          "duration" &&
        optimizationMode.metric !==
          "distance"
      ) {
        throw new Error(
          "Optimization mode metric must be distance or duration."
        );
      }


      const warnings = [];


      const roadAccess =
        await resolveTripRoutingAccess({
          days,

          routingProvider,

          transportProfile,
        });


      if (
        Array.isArray(
          roadAccess.warnings
        )
      ) {
        warnings.push(
          ...roadAccess.warnings
        );
      }


      const inputHash =
        createInputHash({
          trip:
            plan,

          days,

          provider:
            routingProvider,

          profile:
            transportProfile,

          optimizationMode,
        });


      fallbackContext = {
        tripPlanId,

        inputHash,

        days,

        optimizationMode,

        warnings,

        roadAccess,
      };


      /*
        Reuse a fresh analysis when the
        route-relevant trip state is the
        same and the analysis is still
        inside routeCacheHours.
      */

      const previous =
        await getCachedAnalysis(
          tripPlanId,
          inputHash,
          {
            maxAgeHours:
              cacheHours,
          }
        );


      if (previous) {
        const savedData =
          buildSavedAnalysisData({
            analysis:
              previous,

            days,

            optimizationMode,

            cached:
              true,

            warnings,
          });


        if (savedData) {
          return res.json({
            success: true,

            data:
              savedData,
          });
        }
      }


      /* ===================================================
         BUILD ROAD MATRIX
      =================================================== */

      const matrixResult =
        await buildDayMatrices({
          routableDays,

          routingProvider,

          transportProfile,

          cacheHours,
        });


      const matrix =
        optimizationMode.metric ===
        "distance"
          ? matrixResult
              .distanceMatrix
          : matrixResult
              .durationMatrix;


      const costBetween =
        (
          fromDay,
          toDay
        ) => {
          if (
            !fromDay?.routable ||
            !toDay?.routable
          ) {
            return Infinity;
          }


          return matrix[
            fromDay.matrixIndex
          ][
            toDay.matrixIndex
          ];
        };


      const currentOrder =
        [...days];


      let optimizedOrder =
        optimizeDayOrder(
          days,
          costBetween
        );


      const optimizerChangedOrder =
        orderChanged(
          currentOrder,
          optimizedOrder
        );


      /* ===================================================
         CREATE REAL ROAD GEOMETRY

         Whole day moves together.

         Internal destination order
         inside each day stays together.
      =================================================== */

      const currentCoordinates =
        flattenCoordinates(
          currentOrder
        );


      const optimizedCoordinates =
        flattenCoordinates(
          optimizedOrder
        );


      const currentRoute =
        await getDirectionsBatched({
          baseUrl:
            routingProvider
              .baseUrl,

          profile:
            transportProfile
              .providerProfile,

          coordinates:
            currentCoordinates,

          preference:
            optimizationMode
              .providerPreference ||
            undefined,

          timeoutMs:
            routingProvider
              .requestTimeoutMs,
        });


      let optimizedRoute =
        currentRoute;


      if (
        optimizerChangedOrder
      ) {
        optimizedRoute =
          await getDirectionsBatched({
            baseUrl:
              routingProvider
                .baseUrl,

            profile:
              transportProfile
                .providerProfile,

            coordinates:
              optimizedCoordinates,

            preference:
              optimizationMode
                .providerPreference ||
              undefined,

            timeoutMs:
              routingProvider
                .requestTimeoutMs,
          });
      }


      const currentMetric =
        optimizationMode.metric ===
        "distance"
          ? currentRoute
              .distanceMeters
          : currentRoute
              .durationSeconds;


      const optimizedMetric =
        optimizationMode.metric ===
        "distance"
          ? optimizedRoute
              .distanceMeters
          : optimizedRoute
              .durationSeconds;


      /*
        Matrix optimization is a planning
        stage.

        Final Directions result is the
        authority.

        If the suggested order did not
        actually improve the selected
        final routing metric, keep the
        user's original itinerary.
      */
      const improved =
        optimizerChangedOrder &&
        Number(
          optimizedMetric
        ) <
          Number(
            currentMetric
          );


      if (!improved) {
        optimizedOrder =
          currentOrder;

        optimizedRoute =
          currentRoute;
      }


      const currentOrderIds =
        currentOrder.map(
          (day) =>
            day.dayId
        );


      const optimizedOrderIds =
        optimizedOrder.map(
          (day) =>
            day.dayId
        );


      const routeGeometry = {
        current:
          currentRoute.geometry,

        optimized:
          optimizedRoute.geometry,
      };


      const [
        analysisResult,
      ] =
        await pool.query(
          `
          INSERT INTO
            trip_route_analyses
          (
            trip_plan_id,

            provider_name,
            transport_profile,
            optimization_mode,

            current_distance_meters,
            current_duration_seconds,

            optimized_distance_meters,
            optimized_duration_seconds,

            current_order,
            optimized_order,

            route_geometry,

            input_hash
          )

          VALUES
          (
            ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?,
            ?
          )
          `,
          [
            tripPlanId,

            routingProvider.key,

            transportProfile.key,

            optimizationMode.key,

            currentRoute
              .distanceMeters,

            currentRoute
              .durationSeconds,

            optimizedRoute
              .distanceMeters,

            optimizedRoute
              .durationSeconds,

            JSON.stringify(
              currentOrderIds
            ),

            JSON.stringify(
              optimizedOrderIds
            ),

            JSON.stringify(
              routeGeometry
            ),

            inputHash,
          ]
        );


      if (
        matrixResult
          .staleFallbackUsed
      ) {
        warnings.push(
          "The road-routing provider was temporarily unavailable, so matching cached road-distance and travel-time values were used for route ordering."
        );
      }


      /*
        ORS Matrix currently does not
        expose the Directions "shortest"
        preference.

        Therefore distance-based ordering
        uses the Matrix road-distance
        values, while the final road route
        is validated using Directions.
      */
      if (
        optimizationMode.metric ===
        "distance"
      ) {
        warnings.push(
          "Distance ordering uses road-distance values from the routing matrix. The final recommended route is validated using the Directions service."
        );
      }


      const emptyDays =
        days
          .filter(
            (day) =>
              !day.routable
          )
          .map(
            (day) =>
              day.dayNumber
          );


      if (
        emptyDays.length
      ) {
        warnings.push(
          "Days without destinations were kept in their original positions."
        );
      }


      return res.json({
        success: true,

        data: {
          analysisId:
            analysisResult.insertId,

          cached:
            false,

          matrixCache: {
            providerCalled:
              matrixResult
                .providerCalled,

            pairCount:
              matrixResult
                .pairCount,

            staleFallbackUsed:
              matrixResult
                .staleFallbackUsed,

            stalePairCount:
              matrixResult
                .stalePairCount,
          },

          roadAccess: {
            adjustedDestinationCount:
              roadAccess
                .adjustedCount,

            maxAdjustmentMeters:
              roadAccess
                .maxAdjustmentMeters,

            staleFallbackUsed:
              roadAccess
                .staleFallbackUsed,

            persistentCacheAvailable:
              roadAccess
                .cacheAvailable,
          },

          provider:
            routingProvider.key,

          transportProfile:
            transportProfile.key,

          optimizationMode:
            optimizationMode.key,

          metric:
            optimizationMode.metric,

          improved,

          current: {
            order:
              currentOrder.map(
                serializeDay
              ),

            distanceMeters:
              currentRoute
                .distanceMeters,

            durationSeconds:
              currentRoute
                .durationSeconds,

            geometry:
              currentRoute.geometry,
          },

          recommended: {
            order:
              optimizedOrder.map(
                serializeDay
              ),

            distanceMeters:
              optimizedRoute
                .distanceMeters,

            durationSeconds:
              optimizedRoute
                .durationSeconds,

            geometry:
              optimizedRoute.geometry,
          },

          saving: {
            distanceMeters:
              Math.max(
                0,
                currentRoute
                  .distanceMeters -
                  optimizedRoute
                    .distanceMeters
              ),

            durationSeconds:
              Math.max(
                0,
                currentRoute
                  .durationSeconds -
                  optimizedRoute
                    .durationSeconds
              ),
          },

          warnings,
        },
      });
    } catch (error) {
      console.error(
        "Trip route analysis error:",
        error
      );


      /*
        If retries were exhausted because
        the routing provider is temporarily
        unavailable, try the latest saved
        analysis for the exact same routing
        state.

        This saved analysis includes the
        real road geometry, distance and
        duration from an earlier successful
        provider call.
      */
      if (
        isRoutingProviderRetryableError(
          error
        ) &&
        fallbackContext
      ) {
        try {
          const staleAnalysis =
            await getCachedAnalysis(
              fallbackContext
                .tripPlanId,
              fallbackContext
                .inputHash
            );


          const staleData =
            buildSavedAnalysisData({
              analysis:
                staleAnalysis,

              days:
                fallbackContext
                  .days,

              optimizationMode:
                fallbackContext
                  .optimizationMode,

              cached:
                true,

              staleFallbackUsed:
                true,

              warnings: [
                ...(
                  fallbackContext
                    .warnings ||
                  []
                ),
                "The live road-routing service is temporarily unavailable. TripLanka is showing the latest matching saved road-route analysis.",
              ],
            });


          if (staleData) {
            console.warn(
              "Routing provider unavailable. Returning matching stale saved analysis."
            );


            return res.json({
              success: true,

              data:
                staleData,
            });
          }
        } catch (
          fallbackError
        ) {
          console.error(
            "Failed to load stale routing fallback:",
            fallbackError
          );
        }


        return res
          .status(503)
          .json({
            success: false,

            message:
              "Road routing service is temporarily unavailable. Please try again shortly.",
          });
      }


      if (
        isRoutingAccessResolutionError(
          error
        )
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              error.destinations
                ?.length
                ? `A connected drivable access point could not be found for: ${error.destinations.join(
                    ", "
                  )}. Keep the destination in the trip, but review its road-access location before routing.`
                : "A connected drivable access point could not be found for one or more destinations.",

            problems:
              error.destinations ||
              [],
          });
      }


      if (
        isRoutingProviderUnroutableError(
          error
        )
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "The routing provider could not connect one or more road-access points. Re-analyze once; if the same destination keeps failing, its map coordinate or road-access data should be reviewed.",
          });
      }


      return res
        .status(502)
        .json({
          success: false,

          message:
            error.message ||
            "Trip route analysis failed.",
        });
    }
  };


module.exports = {
  analyzeTripPlannerRoute,
};