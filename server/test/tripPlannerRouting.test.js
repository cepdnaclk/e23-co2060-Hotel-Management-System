const test = require('node:test');
const assert = require('node:assert/strict');
const { createResponse, createTransactionPool, installModule, loadController, request } = require('./helpers/controllerTestUtils');

// Controller fixtures only: no application data, live database or provider is changed.
function fixture(mode = 'fastest', found = true) {
  const calls = [];
  const pairs = new Map();
  const stops = Array.from({ length: 4 }, (_, i) => ({
    trip_day_id: i + 1, trip_item_id: 100 + i, explore_place_id: 10 + i,
    sort_order: 1, name: `Fixture stop ${i}`, lat: String(6 + i / 2), lng: String(80 + i / 4),
  }));
  const settings = {
    trip_planner_config: { routeCacheHours: 24 },
    trip_planner_routing_provider: { key: 'openrouteservice', baseUrl: 'https://provider.test/v2', enabled: true },
    trip_planner_transport_profiles: [{ key: 'car', providerProfile: 'driving-car' }],
    trip_planner_optimization_modes: [
      { key: 'fastest', metric: 'duration', providerPreference: 'fastest' },
      { key: 'shortest', metric: 'distance', providerPreference: 'shortest' },
    ],
  };
  const db = createTransactionPool(async (sql, params) => {
    if (sql.includes('FROM trip_plans tp')) return [found ? [{ id: 7, transport_profile: 'car', optimization_mode: mode }] : []];
    if (sql.includes('FROM trip_plan_days tpd') && !sql.includes('LEFT JOIN explore_places')) {
      return [stops.map((s, i) => ({ id: s.trip_day_id, day_number: i + 1, trip_date: `2099-01-0${i + 1}`, is_locked: true }))];
    }
    if (sql.includes('FROM trip_plan_items tpi')) return [stops];
    if (sql.includes('FROM explore_settings')) return [Object.entries(settings).map(([setting_key, setting_value]) => ({ setting_key, setting_value }))];
    if (sql.includes('FROM trip_route_analyses')) return [[]];
    if (sql.includes('FROM trip_route_cache')) return [params.map(key => pairs.get(key)).filter(Boolean)];
    if (sql.startsWith('INSERT INTO trip_route_cache')) {
      for (let i = 0; i < params.length; i += 12) pairs.set(params[i], {
        cache_key: params[i], distance_meters: params[i + 9], duration_seconds: params[i + 10], expires_at: params[i + 11],
      });
      return [{ affectedRows: pairs.size }];
    }
    if (sql.startsWith('UPDATE trip_route_cache')) return [{ affectedRows: pairs.size }];
    if (sql.startsWith('INSERT INTO trip_route_analyses')) return [{ insertId: 99 }];
    throw new Error(`Unexpected test query: ${sql}`);
  });
  installModule('src/utils/routingAccessResolver.js', {
    resolveTripRoutingAccess: async () => ({ warnings: [], adjustedCount: 0, maxAdjustmentMeters: 0, cacheAvailable: true }),
    getRoutingLat: stop => Number(stop.lat), getRoutingLng: stop => Number(stop.lng),
    isRoutingAccessResolutionError: () => false,
  });
  const controller = loadController('tripPlannerRouting.controller.js', db.pool, {
    mockRoutingClient: {
      getMatrix: async ({ sources, destinations }) => ({
        distances: sources.map((_, i) => destinations.map((_, j) => i === j ? 0 : 10000)),
        durations: sources.map((_, i) => destinations.map((_, j) => i === j ? 0 : 1000)),
      }),
      getDirectionsBatched: async (input) => {
        calls.push(input);
        return { geometry: { type: 'LineString', coordinates: input.coordinates }, distanceMeters: 30000, durationSeconds: 3000 };
      },
      isRoutingProviderRetryableError: () => false,
      isRoutingProviderUnroutableError: () => false,
    },
  });
  return { ...db, controller, calls, stops };
}

for (const mode of ['fastest', 'shortest']) {
  for (const guest of [false, true]) {
    test(`${guest ? 'guest cookie' : 'tourist'} routing preserves four ordered stops and ${mode} preference`, async () => {
      const f = fixture(mode);
      const { res, state } = createResponse();
      await f.controller.analyzeTripPlannerRoute(request({
        body: { tripPlanId: 7 }, user: guest ? null : { id: 55, role: 'tourist' },
        headers: guest ? { cookie: 'tourismhub_guest_id=fixture-guest' } : {},
      }), res);
      assert.equal(state.status, 200);
      assert.equal(state.body.success, true);
      assert.equal(state.body.data.current.order.length, 4);
      assert.equal(state.body.data.current.distanceMeters, 30000);
      assert.equal(state.body.data.current.durationSeconds, 3000);
      assert.deepEqual(f.calls[0].coordinates, f.stops.map(s => [Number(s.lng), Number(s.lat)]));
      assert.equal(f.calls[0].preference, mode);
      assert.equal(f.calls[0].profile, 'driving-car');
      const ownerQuery = f.stats.calls.find(c => c.sql.includes('FROM trip_plans tp'));
      assert.ok(ownerQuery.sql.includes(guest ? 'tp.guest_session_id = ?' : 'tp.user_id = ?'));
      assert.equal(ownerQuery.params[1], guest ? 'fixture-guest' : 55);
      assert.deepEqual(state.body.data.current.geometry.coordinates, f.calls[0].coordinates);
    });
  }
}

for (const role of ['partner', 'admin', 'reception']) {
  test(`${role} analysis is denied before database/provider access`, async () => {
    const f = fixture();
    const { res, state } = createResponse();
    await f.controller.analyzeTripPlannerRoute(request({ body: { tripPlanId: 7 }, user: { id: 55, role } }), res);
    assert.equal(state.status, 403);
    assert.match(state.body.message, /Only tourists or guest users/);
    assert.equal(f.stats.calls.length, 0);
    assert.equal(f.calls.length, 0);
  });
}

test('a guest without a persisted guest cookie cannot analyze another plan', async () => {
  const f = fixture();
  const { res, state } = createResponse();
  await f.controller.analyzeTripPlannerRoute(request({ body: { tripPlanId: 7 } }), res);
  assert.equal(state.status, 404);
  assert.equal(f.stats.calls.length, 0);
});

test('a plan outside the authenticated owner scope is not routed', async () => {
  const f = fixture('fastest', false);
  const { res, state } = createResponse();
  await f.controller.analyzeTripPlannerRoute(request({ body: { tripPlanId: 7 }, user: { id: 55, role: 'tourist' } }), res);
  assert.equal(state.status, 404);
  assert.equal(f.calls.length, 0);
});

test('changed stops produce a new input hash and replacement provider geometry', async () => {
  const f = fixture();
  const req = request({ body: { tripPlanId: 7 }, user: { id: 55, role: 'tourist' } });
  const first = createResponse();
  await f.controller.analyzeTripPlannerRoute(req, first.res);
  const originalGeometry = structuredClone(first.state.body.data.current.geometry);
  f.stops[1].lng = '81.75';
  const second = createResponse();
  await f.controller.analyzeTripPlannerRoute(req, second.res);
  assert.equal(second.state.status, 200);
  assert.notDeepEqual(second.state.body.data.current.geometry, originalGeometry);
  const hashes = f.stats.calls.filter(c => c.sql.includes('FROM trip_route_analyses')).map(c => c.params[1]);
  assert.notEqual(hashes[0], hashes[1]);
  assert.deepEqual(second.state.body.data.current.geometry.coordinates, f.calls.at(-1).coordinates);
});
