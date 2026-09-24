const assert = require("assert");
const path = require("path");

const resolverPath = path.resolve(
  __dirname,
  "../src/utils/routingAccessResolver.js"
);
const dbPath = path.resolve(
  __dirname,
  "../src/config/db.js"
);
const clientPath = path.resolve(
  __dirname,
  "../src/utils/routingClient.js"
);

const tableMissing = () => {
  const error = new Error("table missing");
  error.code = "ER_NO_SUCH_TABLE";
  error.errno = 1146;
  throw error;
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    query: async () => tableMissing(),
  },
};

let snapCallCount = 0;

const matrixFor = ({
  locations,
  sources,
  destinations,
}) => {
  const sourceIndexes = Array.isArray(sources)
    ? sources.map(Number)
    : locations.map((_, index) => index);
  const destinationIndexes =
    Array.isArray(destinations)
      ? destinations.map(Number)
      : locations.map((_, index) => index);

  const isDisconnectedYala = (coordinate) =>
    Math.abs(Number(coordinate[0]) - 81.5159) <
      0.0001 &&
    Math.abs(Number(coordinate[1]) - 6.3711) <
      0.0001;

  const durations = sourceIndexes.map(
    (sourceIndex) =>
      destinationIndexes.map(
        (destinationIndex) => {
          if (sourceIndex === destinationIndex) {
            return 0;
          }

          if (
            isDisconnectedYala(
              locations[sourceIndex]
            ) ||
            isDisconnectedYala(
              locations[destinationIndex]
            )
          ) {
            return null;
          }

          return 1000;
        }
      )
  );

  return {
    durations,
    distances: durations.map((row) =>
      row.map((value) =>
        value === null ? null : value * 10
      )
    ),
  };
};

require.cache[clientPath] = {
  id: clientPath,
  filename: clientPath,
  loaded: true,
  exports: {
    getMatrix: async (args) => matrixFor(args),

    snapLocationsProgressively: async ({
      locations,
    }) => {
      snapCallCount += 1;

      // First call: direct snap. Keep all original points.
      if (snapCallCount === 1) {
        return locations.map((coordinate) => ({
          coordinate: [...coordinate],
          snappedDistanceMeters: 0,
          radiusMeters: 500,
        }));
      }

      // Candidate search for the disconnected park: every sampled
      // candidate resolves to one connected public-road point.
      return locations.map(() => ({
        coordinate: [81.30, 6.30],
        snappedDistanceMeters: 100,
        radiusMeters: 2000,
      }));
    },

    isRoutingProviderRetryableError: () => false,
  },
};

const {
  resolveTripRoutingAccess,
} = require(resolverPath);

const makeDestination = (
  placeId,
  name,
  lat,
  lng
) => ({
  placeId,
  name,
  lat,
  lng,
});

const run = async () => {
  const kandy = makeDestination(
    1,
    "Kandy",
    7.2906,
    80.6337
  );

  const galle = makeDestination(
    2,
    "Galle Fort",
    6.0269,
    80.217
  );

  const yala = makeDestination(
    3,
    "Yala National Park",
    6.3711,
    81.5159
  );

  const days = [kandy, galle, yala].map(
    (destination, index) => ({
      dayId: index + 1,
      validDestinations: [destination],
      entry: destination,
      exit: destination,
    })
  );

  const result = await resolveTripRoutingAccess({
    days,
    routingProvider: {
      key: "openrouteservice",
      baseUrl: "https://example.test/v2",
      requestTimeoutMs: 1000,
      snapFallbackEnabled: true,
      accessSearchRingKm: [1, 3, 7],
      accessSearchBearings: 8,
      accessCandidateSnapRadiusMeters: 2000,
    },
    transportProfile: {
      providerProfile: "driving-car",
    },
  });

  assert.equal(kandy.routingLng, 80.6337);
  assert.equal(galle.routingLng, 80.217);

  assert.equal(yala.routingLng, 81.30);
  assert.equal(yala.routingLat, 6.30);
  assert.equal(
    yala.routingAccessSourceType,
    "connected_search"
  );

  assert.equal(result.adjustedCount, 1);
  assert(result.warnings.length >= 1);
  assert(
    result.warnings[0].includes(
      "Yala National Park"
    )
  );

  console.log(
    "routingAccessResolver tests passed: disconnected POI repaired to connected road access"
  );
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
