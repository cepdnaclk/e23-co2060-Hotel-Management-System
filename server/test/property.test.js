const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createResponse,
  createTransactionPool,
  loadController,
  request,
} = require('./helpers/controllerTestUtils');

const plan = {
  plan_key: 'standard',
  plan_name: 'Standard',
  room_limit: 5,
  registration_fee: 5000,
  monthly_fee: 2500,
};

function validProperty(overrides = {}) {
  return {
    name: 'Automated Test Hotel',
    city: 'Kandy',
    district: 'Kandy',
    address: '1 Test Road',
    description: 'Property created by an automated controller test.',
    property_type: 'Hotel',
    property_password: 'Property@123',
    plan_type: 'standard',
    rooms: [],
    photos: [],
    policies: null,
    ...overrides,
  };
}

test('partner property registration validates required fields and strong property password', async () => {
  const { pool, stats } = createTransactionPool(async () => { throw new Error('DB query should not run'); });
  const controller = loadController('partner.controller.js', pool);

  let out = createResponse();
  await controller.createProperty(request({ user: { id: 2 }, body: { name: 'Only name' } }), out.res);
  assert.equal(out.state.status, 400);
  assert.equal(stats.rollback, 1);

  out = createResponse();
  await controller.createProperty(request({ user: { id: 2 }, body: validProperty({ property_password: 'weak' }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /8 characters/i);
});

test('property registration enforces selected plan room limit', async () => {
  const { pool, stats } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT * FROM property_plans')) return [[plan]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partner.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createProperty(request({
    user: { id: 2 },
    body: validProperty({ rooms: [{ total_rooms: 3 }, { total_rooms: 3 }] }),
  }), res);
  assert.equal(state.status, 400);
  assert.match(state.body.message, /maximum 5 rooms/i);
  assert.equal(stats.rollback, 1);
});

test('valid property registration is stored as a pending property', async () => {
  let insertParams;
  const { pool, stats } = createTransactionPool(async (sql, params) => {
    if (sql.startsWith('SELECT * FROM property_plans')) return [[plan]];
    if (sql.startsWith('INSERT INTO properties')) {
      insertParams = params;
      return [{ insertId: 51 }];
    }
    if (sql.startsWith('INSERT INTO notifications')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partner.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createProperty(request({ user: { id: 2 }, body: validProperty() }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.property_id, 51);
  assert.equal(insertParams[0], 2);
  assert.equal(insertParams[1], 'Automated Test Hotel');
  assert.equal(insertParams[12], 'standard');
  assert.equal(stats.commit, 1);
  assert.equal(stats.rollback, 0);
});

test('adding a room validates values and partner ownership', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT p.id,')) return [[]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partner.controller.js', pool);

  let out = createResponse();
  await controller.addRoomToMyProperty(request({
    user: { id: 2 }, params: { id: '10' }, body: { room_type: '', capacity: 0 },
  }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.addRoomToMyProperty(request({
    user: { id: 2 }, params: { id: '10' },
    body: { room_type: 'Deluxe', capacity: 2, base_occupancy: 2, price_per_night: 12000, total_rooms: 1 },
  }), out.res);
  assert.equal(out.state.status, 404);
});

test('adding a room prevents exceeding the property room limit', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT p.id,')) return [[{ id: 10, room_limit: 5, current_rooms: 4 }]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partner.controller.js', pool);
  const { res, state } = createResponse();
  await controller.addRoomToMyProperty(request({
    user: { id: 2 }, params: { id: '10' },
    body: { room_type: 'Family', capacity: 4, base_occupancy: 2, price_per_night: 22000, total_rooms: 2 },
  }), res);
  assert.equal(state.status, 400);
  assert.match(state.body.message, /room limit exceeded/i);
});

test('adding a valid room inserts the room and optional main photo', async () => {
  const calls = [];
  const { pool } = createTransactionPool(async (sql, params) => {
    calls.push({ sql, params });
    if (sql.startsWith('SELECT p.id,')) return [[{ id: 10, room_limit: 10, current_rooms: 4 }]];
    if (sql.startsWith('INSERT INTO rooms')) return [{ insertId: 88 }];
    if (sql.startsWith('INSERT INTO room_photos')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partner.controller.js', pool);
  const { res, state } = createResponse();
  await controller.addRoomToMyProperty(request({
    user: { id: 2 }, params: { id: '10' },
    body: {
      room_type: 'Lake View', capacity: 3, base_occupancy: 2,
      price_per_night: 18000, extra_person_price: 2500,
      price_per_day: 12000, total_rooms: 2,
      image_url: '/uploads/room/lake.jpg',
    },
  }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.room_id, 88);
  assert.ok(calls.some((call) => call.sql.startsWith('INSERT INTO room_photos')));
});

test('admin approval verifies a property and sends a partner notification', async () => {
  const { pool, stats } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, partner_id, name FROM properties')) {
      return [[{ id: 10, partner_id: 2, name: 'Test Hotel' }]];
    }
    if (sql.startsWith('UPDATE properties SET status = \'approved\'')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO notifications')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('admin.controller.js', pool);
  const { res, state } = createResponse();
  await controller.approveProperty(request({ user: { id: 1, role: 'admin' }, params: { id: '10' } }), res);
  assert.equal(state.status, 200);
  assert.equal(state.body.data.status, 'approved');
  assert.equal(state.body.data.is_verified, true);
  assert.equal(stats.commit, 1);
});

test('admin rejection requires a reason and records the rejection', async () => {
  const { pool, stats } = createTransactionPool(async (sql, params) => {
    if (sql.startsWith('SELECT id, partner_id, name FROM properties')) {
      return [[{ id: 10, partner_id: 2, name: 'Test Hotel' }]];
    }
    if (sql.startsWith('UPDATE properties SET status = \'rejected\'')) {
      assert.equal(params[0], 'Missing licence');
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT INTO notifications')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('admin.controller.js', pool);

  let out = createResponse();
  await controller.rejectProperty(request({ user: { id: 1 }, params: { id: '10' }, body: {} }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.rejectProperty(request({ user: { id: 1 }, params: { id: '10' }, body: { rejection_reason: ' Missing licence ' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(stats.commit, 1);
});
