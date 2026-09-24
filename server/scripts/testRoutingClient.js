const assert = require("assert");

process.env.ROUTING_API_KEY = "test-key";
process.env.ROUTING_RETRY_COUNT = "1";
process.env.ROUTING_RETRY_BASE_DELAY_MS = "100";

const {
  getDirections,
  getDirectionsBatched,
  snapLocationsProgressively,
  isRoutingProviderUnroutableError,
} = require("../src/utils/routingClient");

const jsonResponse = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });

const run = async () => {
  const originalFetch = global.fetch;

  try {
    // 1) Directions success.
    global.fetch = async () =>
      jsonResponse(200, {
        features: [
          {
            properties: {
              summary: {
                distance: 1234,
                duration: 321,
              },
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [80, 7],
                [81, 8],
              ],
            },
          },
        ],
      });

    const success = await getDirections({
      baseUrl: "https://example.test/v2",
      profile: "driving-car",
      coordinates: [
        [80, 7],
        [81, 8],
      ],
      timeoutMs: 1000,
    });

    assert.equal(
      success.features[0].properties.summary.distance,
      1234
    );

    // 2) Temporary 503 retries and then succeeds.
    let retryCalls = 0;
    global.fetch = async () => {
      retryCalls += 1;

      if (retryCalls === 1) {
        return jsonResponse(503, {
          message: "temporary",
        });
      }

      return jsonResponse(200, {
        features: [
          {
            properties: {
              summary: {
                distance: 100,
                duration: 20,
              },
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [80, 7],
                [80.1, 7.1],
              ],
            },
          },
        ],
      });
    };

    await getDirections({
      baseUrl: "https://example.test/v2",
      profile: "driving-car",
      coordinates: [
        [80, 7],
        [80.1, 7.1],
      ],
      timeoutMs: 1000,
    });

    assert.equal(retryCalls, 2);

    // 3) Route-not-found is classified and NOT endlessly retried.
    let notFoundCalls = 0;
    global.fetch = async () => {
      notFoundCalls += 1;
      return jsonResponse(404, {
        error: {
          message:
            "Route could not be found - Unable to find a route between points 0 and 1.",
        },
      });
    };

    let routeError = null;

    try {
      await getDirections({
        baseUrl: "https://example.test/v2",
        profile: "driving-car",
        coordinates: [
          [80, 7],
          [81, 8],
        ],
        timeoutMs: 1000,
      });
    } catch (error) {
      routeError = error;
    }

    assert(routeError);
    assert(
      isRoutingProviderUnroutableError(routeError)
    );
    assert.equal(notFoundCalls, 1);

    // 4) Progressive snapping retries only unresolved points.
    let snapCall = 0;
    global.fetch = async (_url, options) => {
      snapCall += 1;
      const body = JSON.parse(options.body);

      if (snapCall === 1) {
        assert.equal(body.radius, 500);
        assert.equal(body.locations.length, 2);

        return jsonResponse(200, {
          locations: [
            {
              location: [80.01, 7.01],
              snapped_distance: 20,
            },
            null,
          ],
        });
      }

      assert.equal(body.radius, 2000);
      assert.equal(body.locations.length, 1);

      return jsonResponse(200, {
        locations: [
          {
            location: [81.01, 8.01],
            snapped_distance: 900,
          },
        ],
      });
    };

    const snapped =
      await snapLocationsProgressively({
        baseUrl: "https://example.test/v2",
        profile: "driving-car",
        locations: [
          [80, 7],
          [81, 8],
        ],
        radii: [500, 2000],
        timeoutMs: 1000,
      });

    assert.equal(snapCall, 2);
    assert.deepEqual(
      snapped[0].coordinate,
      [80.01, 7.01]
    );
    assert.deepEqual(
      snapped[1].coordinate,
      [81.01, 8.01]
    );

    // 5) Batching preserves geometry and totals.
    let batchCalls = 0;
    global.fetch = async (_url, options) => {
      batchCalls += 1;
      const body = JSON.parse(options.body);
      const coordinates = body.coordinates;

      return jsonResponse(200, {
        features: [
          {
            properties: {
              summary: {
                distance: 100 * batchCalls,
                duration: 10 * batchCalls,
              },
            },
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        ],
      });
    };

    const batched =
      await getDirectionsBatched({
        baseUrl: "https://example.test/v2",
        profile: "driving-car",
        coordinates: [
          [80, 7],
          [80.1, 7.1],
          [80.2, 7.2],
          [80.3, 7.3],
        ],
        maxWaypoints: 3,
        timeoutMs: 1000,
      });

    assert.equal(batchCalls, 2);
    assert.equal(batched.distanceMeters, 300);
    assert.equal(batched.durationSeconds, 30);
    assert.equal(
      batched.geometry.coordinates.length,
      4
    );

    console.log(
      "routingClient tests passed: 5/5"
    );
  } finally {
    global.fetch = originalFetch;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
