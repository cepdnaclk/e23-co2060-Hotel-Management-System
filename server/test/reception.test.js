const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  createResponse,
  createTransactionPool,
  loadController,
  request,
} = require('./helpers/controllerTestUtils');

process.env.JWT_SECRET = 'server-automated-test-secret';

function room(overrides = {}) {
  return {
    id: 11,
    property_id: 1,
    room_type: 'Deluxe',
    capacity: 3,
    base_occupancy: 2,
    price_per_night: 10000,
    price_per_day: 6000,
    extra_person_price: 2000,
    total_rooms: 5,
    available_rooms: 2,
    ...overrides,
  };
}

function validReceptionBooking(overrides = {}) {
  return {
    room_id: 11,
    full_name: 'Walk In Guest',
    email: 'walkin@test.lk',
    nationality: 'Sri Lankan',
    country_code: '+94',
    phone: '711234567',
    check_in: '2099-03-10',
    check_out: '2099-03-11',
    check_in_package: 'night',
    check_out_package: 'day',
    guests: 2,
    adults: 2,
    children: 0,
    payment_method: 'cash',
    ...overrides,
  };
}

test('reception login requires partner email and property password', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run'); });
  const controller = loadController('reception.controller.js', pool);
  const { res, state } = createResponse();
  await controller.loginReception(request({ body: {} }), res);
  assert.equal(state.status, 400);
});

test('reception login rejects wrong property management password', async () => {
  const hash = await bcrypt.hash('Property@123', 4);
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT p.id, p.partner_id, p.name, p.property_password_hash')) {
      return [[{ id: 1, partner_id: 2, name: 'Test Hotel', property_password_hash: hash, status: 'approved', partner_email: 'partner@test.lk', partner_name: 'Partner' }]];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);
  const { res, state } = createResponse();
  await controller.loginReception(request({ body: { email: 'partner@test.lk', property_password: 'Wrong@123' } }), res);
  assert.equal(state.status, 401);
});

test('valid reception login returns reception-scoped JWT and property data', async () => {
  const hash = await bcrypt.hash('Property@123', 4);
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT p.id, p.partner_id, p.name, p.property_password_hash')) {
      return [[{ id: 1, partner_id: 2, name: 'Test Hotel', property_password_hash: hash, status: 'approved', partner_email: 'partner@test.lk', partner_name: 'Partner' }]];
    }
    if (sql.startsWith('SELECT p.id, p.partner_id, p.name, p.city')) {
      return [[{ id: 1, partner_id: 2, name: 'Test Hotel', city: 'Kandy', status: 'approved', is_verified: 1 }]];
    }
    if (sql.startsWith('SELECT r.id, r.property_id, r.room_type')) return [[room()]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);
  const { res, state } = createResponse();
  await controller.loginReception(request({ body: { email: 'PARTNER@test.lk', property_password: 'Property@123', property_id: 1 } }), res);
  assert.equal(state.status, 200);
  assert.equal(state.body.user.role, 'reception');
  assert.equal(state.body.data.id, 1);
  const decoded = jwt.verify(state.body.token, process.env.JWT_SECRET);
  assert.equal(decoded.role, 'reception');
  assert.equal(decoded.property_id, 1);
});

test('room availability update validates whole-number range', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, total_rooms FROM rooms')) return [[{ id: 11, total_rooms: 5 }]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);

  let out = createResponse();
  await controller.updateReceptionRoomAvailability(request({ user: { property_id: 1 }, params: { roomId: '11' }, body: { available_rooms: -1 } }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.updateReceptionRoomAvailability(request({ user: { property_id: 1 }, params: { roomId: '11' }, body: { available_rooms: 6 } }), out.res);
  assert.equal(out.state.status, 400);
});

test('reception booking validates payment method, email and stay dates', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run for these validation branches'); });
  const controller = loadController('reception.controller.js', pool);

  let out = createResponse();
  await controller.createReceptionBooking(request({ user: { property_id: 1 }, body: validReceptionBooking({ payment_method: 'bank' }) }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createReceptionBooking(request({ user: { property_id: 1 }, body: validReceptionBooking({ email: 'bad-email' }) }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createReceptionBooking(request({ user: { property_id: 1 }, body: validReceptionBooking({ check_in: '2099-03-12', check_out: '2099-03-11' }) }), out.res);
  assert.equal(out.state.status, 400);
});

test('reception booking rejects full rooms and over-capacity guest counts', async () => {
  let selectedRoom = room({ available_rooms: 0 });
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, property_id, room_type, capacity')) return [[selectedRoom]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);

  let out = createResponse();
  await controller.createReceptionBooking(request({ user: { property_id: 1 }, body: validReceptionBooking() }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /fully occupied/i);

  selectedRoom = room({ available_rooms: 2, capacity: 2 });
  out = createResponse();
  await controller.createReceptionBooking(request({ user: { property_id: 1 }, body: validReceptionBooking({ guests: 3 }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /between 1 and 2/i);
});

test('valid reception booking records paid approved booking and reduces room availability', async () => {
  let insertParams;
  const { pool, stats } = createTransactionPool(async (sql, params) => {
    if (sql.startsWith('SELECT id, property_id, room_type, capacity')) return [[room()]];
    if (sql.startsWith('INSERT INTO bookings')) {
      insertParams = params;
      return [{ insertId: 77 }];
    }
    if (sql.startsWith('UPDATE rooms SET available_rooms = available_rooms - 1')) return [{ affectedRows: 1 }];
    if (sql.startsWith('SELECT p.id, p.partner_id, p.name, p.city')) return [[{ id: 1, partner_id: 2, name: 'Test Hotel', city: 'Kandy' }]];
    if (sql.startsWith('SELECT r.id, r.property_id, r.room_type')) return [[room({ available_rooms: 1 })]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createReceptionBooking(request({ user: { property_id: 1 }, body: validReceptionBooking({ guests: 3 }) }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.booking_id, 77);
  assert.equal(state.body.payment_status, 'Paid');
  assert.equal(state.body.booking_status, 'Approved');
  assert.equal(state.body.total_amount, 20000);
  assert.match(insertParams.at(-1), /Cash/);
  assert.equal(stats.commit, 1);
});

test('reception status workflow enforces transitions and restores room on checkout', async () => {
  let bookingStatus = 'Approved';
  const updates = [];
  const { pool } = createTransactionPool(async (sql, params) => {
    if (sql.startsWith('SELECT b.id, b.room_id, b.booking_status')) {
      return [[{ id: 77, room_id: 11, booking_status: bookingStatus, available_rooms: 1, total_rooms: 5 }]];
    }
    if (sql.startsWith('UPDATE bookings SET booking_status')) {
      updates.push(params[0]);
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('UPDATE rooms SET available_rooms = LEAST')) {
      updates.push('room+1');
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);

  let out = createResponse();
  await controller.updateReceptionBookingStatus(request({ user: { property_id: 1 }, params: { bookingId: '77' }, body: { action: 'check_in' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.booking_status, 'Checked In');

  bookingStatus = 'Checked In';
  out = createResponse();
  await controller.updateReceptionBookingStatus(request({ user: { property_id: 1 }, params: { bookingId: '77' }, body: { action: 'check_out' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.booking_status, 'Checked Out');
  assert.ok(updates.includes('room+1'));

  bookingStatus = 'Checked Out';
  out = createResponse();
  await controller.updateReceptionBookingStatus(request({ user: { property_id: 1 }, params: { bookingId: '77' }, body: { action: 'check_out' } }), out.res);
  assert.equal(out.state.status, 400);
});

test('reception payment update validates status and property ownership', async () => {
  let affectedRows = 1;
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('UPDATE bookings SET payment_status')) return [{ affectedRows }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('reception.controller.js', pool);

  let out = createResponse();
  await controller.updateReceptionBookingPayment(request({ user: { property_id: 1 }, params: { bookingId: '77' }, body: { payment_status: 'Unknown' } }), out.res);
  assert.equal(out.state.status, 400);

  affectedRows = 0;
  out = createResponse();
  await controller.updateReceptionBookingPayment(request({ user: { property_id: 1 }, params: { bookingId: '77' }, body: { payment_status: 'Paid' } }), out.res);
  assert.equal(out.state.status, 404);

  affectedRows = 1;
  out = createResponse();
  await controller.updateReceptionBookingPayment(request({ user: { property_id: 1 }, params: { bookingId: '77' }, body: { payment_status: 'Paid' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.payment_status, 'Paid');
});
