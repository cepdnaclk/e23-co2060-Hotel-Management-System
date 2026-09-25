const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createResponse,
  createTransactionPool,
  loadController,
  request,
} = require('./helpers/controllerTestUtils');


async function withoutExpectedErrorLogs(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

const settingsRows = [
  { setting_key: 'travel_styles', setting_value: ['Culture', 'Adventure', 'Relaxation'] },
  { setting_key: 'budget_daily_targets', setting_value: { Low: 8000, Medium: 18000, High: 45000 } },
  { setting_key: 'trip_planner_config', setting_value: { maxDays: 30, maxDestinationsPerDay: 10 } },
  { setting_key: 'trip_planner_transport_profiles', setting_value: [{ key: 'driving-car', label: 'Car / Taxi' }] },
  { setting_key: 'trip_planner_optimization_modes', setting_value: [{ key: 'fastest', label: 'Less travel time' }, { key: 'shortest', label: 'Less distance' }] },
];

function validTrip(overrides = {}) {
  return {
    title: 'Sri Lanka Test Trip',
    startDate: '2099-04-01',
    endDate: '2099-04-03',
    travelStyle: 'Culture',
    budgetLevel: 'Medium',
    travellerCount: 2,
    optimizationMode: 'fastest',
    transportProfile: 'driving-car',
    status: 'saved',
    days: [
      { date: '2099-04-01', notes: 'Day 1', items: [] },
      { date: '2099-04-02', notes: 'Day 2', items: [] },
      { date: '2099-04-03', notes: 'Day 3', items: [] },
    ],
    ...overrides,
  };
}

function tripPool(extraHandler = null) {
  let nextDayId = 100;
  return createTransactionPool(async (sql, params, stats) => {
    if (extraHandler) {
      const result = await extraHandler(sql, params, stats);
      if (result !== undefined) return result;
    }
    if (sql.startsWith('SELECT setting_key, setting_value FROM explore_settings')) return [settingsRows];
    if (sql.startsWith('INSERT INTO trip_plans')) return [{ insertId: 50 }];
    if (sql.startsWith('INSERT INTO trip_plan_days')) return [{ insertId: nextDayId++ }];
    if (sql.startsWith('INSERT INTO trip_plan_items')) return [{ insertId: 200 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
}

test('trip planner rejects partner/admin users from managing tourist plans', async () => {
  const { pool } = tripPool();
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });
  const { res, state } = createResponse();
  await controller.createTripPlan(request({
    user: { id: 2, role: 'partner' }, headers: {}, body: validTrip(),
  }), res);
  assert.equal(state.status, 403);
  assert.match(state.body.message, /only tourists or guest/i);
});

test('trip planner validates title, date order and traveller count', async () => {
  const { pool } = tripPool();
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });

  for (const [body, message] of [
    [validTrip({ title: '' }), /title is required/i],
    [validTrip({ startDate: '2099-04-03', endDate: '2099-04-01', days: [] }), /end date cannot be before/i],
    [validTrip({ travellerCount: 0 }), /at least 1/i],
  ]) {
    const out = createResponse();
    await withoutExpectedErrorLogs(() => controller.createTripPlan(request({ user: { id: 7, role: 'tourist' }, headers: {}, body }), out.res));
    assert.equal(out.state.status, 400);
    assert.match(out.state.body.message, message);
  }
});

test('trip planner enforces configured maximum days and destination count', async () => {
  const { pool } = tripPool();
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });

  let out = createResponse();
  await withoutExpectedErrorLogs(() => controller.createTripPlan(request({
    user: { id: 7, role: 'tourist' }, headers: {},
    body: validTrip({ startDate: '2099-01-01', endDate: '2099-02-15', days: [] }),
  }), out.res));
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /maximum of 30 days/i);

  const tooMany = Array.from({ length: 11 }, (_, i) => ({ itemType: 'destination', explorePlaceId: i + 1 }));
  out = createResponse();
  await withoutExpectedErrorLogs(() => controller.createTripPlan(request({
    user: { id: 7, role: 'tourist' }, headers: {},
    body: validTrip({ days: [{ date: '2099-04-01', items: tooMany }] }),
  }), out.res));
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /destination limit/i);
});

test('trip planner validates configured style, budget, transport and optimization choices', async () => {
  const { pool } = tripPool();
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });

  for (const body of [
    validTrip({ travelStyle: 'Unknown' }),
    validTrip({ budgetLevel: 'Unlimited' }),
    validTrip({ transportProfile: 'spaceship' }),
    validTrip({ optimizationMode: 'random' }),
  ]) {
    const out = createResponse();
    await withoutExpectedErrorLogs(() => controller.createTripPlan(request({ user: { id: 7, role: 'tourist' }, headers: {}, body }), out.res));
    assert.equal(out.state.status, 400);
  }
});

test('valid tourist trip is saved with days and committed', async () => {
  const { pool, stats } = tripPool();
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });
  const { res, state } = createResponse();
  await controller.createTripPlan(request({
    user: { id: 7, role: 'tourist' }, headers: {}, body: validTrip(),
  }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.data.id, 50);
  assert.equal(stats.commit, 1);
  assert.equal(stats.calls.filter((c) => c.sql.startsWith('INSERT INTO trip_plan_days')).length, 3);
});

test('guest trip receives a persistent guest-session cookie', async () => {
  const { pool } = tripPool();
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });
  const { res, state } = createResponse();
  await controller.createTripPlan(request({ headers: {}, body: validTrip() }), res);
  assert.equal(state.status, 201);
  assert.match(String(state.headers['set-cookie']), /tourismhub_guest_id=/);
  assert.match(String(state.headers['set-cookie']), /HttpOnly/);
});

test('trip item validation rejects unavailable destination sources', async () => {
  const { pool } = tripPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, district, estimated_cost, lat, lng FROM explore_places')) return [[]];
    return undefined;
  });
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });
  const { res, state } = createResponse();
  await withoutExpectedErrorLogs(() => controller.createTripPlan(request({
    user: { id: 7, role: 'tourist' }, headers: {},
    body: validTrip({
      days: [{ date: '2099-04-01', items: [{ itemType: 'destination', explorePlaceId: 999 }] }],
    }),
  }), res));
  assert.equal(state.status, 400);
  assert.match(state.body.message, /destination is not available/i);
});

test('trip list is empty for anonymous user without guest cookie and scoped for tourist user', async () => {
  const { pool } = tripPool(async (sql, params) => {
    if (sql.startsWith('SELECT tp.id, tp.title,')) {
      assert.deepEqual(params, [7]);
      return [[{ id: 50, title: 'Sri Lanka Test Trip', day_count: 3, item_count: 0 }]];
    }
    return undefined;
  });
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });

  let out = createResponse();
  await controller.getMyTripPlans(request({ headers: {} }), out.res);
  assert.equal(out.state.status, 200);
  assert.deepEqual(out.state.body.data, []);

  out = createResponse();
  await controller.getMyTripPlans(request({ user: { id: 7, role: 'tourist' }, headers: {} }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.count, 1);
  assert.equal(out.state.body.data[0].id, 50);
});

test('trip delete respects owner scope and returns 404 when nothing is deleted', async () => {
  let affectedRows = 0;
  const { pool } = tripPool(async (sql) => {
    if (sql.startsWith('DELETE tp FROM trip_plans tp')) return [{ affectedRows }];
    return undefined;
  });
  const controller = loadController('tripPlanner.controller.js', pool, {
    mockRoutingClient: { getDirections: async () => ({}) },
  });

  let out = createResponse();
  await controller.deleteTripPlan(request({ user: { id: 7, role: 'tourist' }, headers: {}, params: { id: '50' } }), out.res);
  assert.equal(out.state.status, 404);

  affectedRows = 1;
  out = createResponse();
  await controller.deleteTripPlan(request({ user: { id: 7, role: 'tourist' }, headers: {}, params: { id: '50' } }), out.res);
  assert.equal(out.state.status, 200);
});
