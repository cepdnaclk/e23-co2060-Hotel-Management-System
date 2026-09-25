const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createResponse,
  createTransactionPool,
  loadController,
  request,
} = require('./helpers/controllerTestUtils');

function validBooking(overrides = {}) {
  return {
    property_id: 1,
    room_id: 11,
    full_name: 'Booking Tester',
    email: 'booking@test.lk',
    nationality: 'Sri Lankan',
    country_code: '+94',
    phone: '711234567',
    check_in: '2099-01-10',
    check_out: '2099-01-11',
    check_in_package: 'night',
    check_out_package: 'day',
    guests: 2,
    notes: 'Automated test booking',
    ...overrides,
  };
}

function room(overrides = {}) {
  return {
    id: 11,
    property_id: 1,
    room_type: 'Deluxe',
    capacity: 3,
    base_occupancy: 2,
    price_per_night: 10000,
    extra_person_price: 2000,
    price_per_day: 6000,
    total_rooms: 5,
    available_rooms: 2,
    ...overrides,
  };
}

test('hotel booking rejects missing details and non-tourist authenticated roles', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run'); });
  const controller = loadController('booking.controller.js', pool);

  let out = createResponse();
  await controller.createBooking(request({ body: { property_id: 1 } }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createBooking(request({ body: validBooking(), user: { id: 2, role: 'partner' } }), out.res);
  assert.equal(out.state.status, 403);
});

test('hotel booking rejects past dates and check-out before check-in', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run'); });
  const controller = loadController('booking.controller.js', pool);

  let out = createResponse();
  await controller.createBooking(request({ body: validBooking({ check_in: '2020-01-01', check_out: '2020-01-02' }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /past date/i);

  out = createResponse();
  await controller.createBooking(request({ body: validBooking({ check_in: '2099-01-12', check_out: '2099-01-11' }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /before check-in/i);
});

test('hotel booking requires an approved property and a matching room', async () => {
  let propertyExists = false;
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, partner_id FROM properties')) {
      return [propertyExists ? [{ id: 1, name: 'Hotel', city: 'Kandy', partner_id: 2 }] : []];
    }
    if (sql.startsWith('SELECT id, property_id, room_type,')) return [[]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);

  let out = createResponse();
  await controller.createBooking(request({ body: validBooking() }), out.res);
  assert.equal(out.state.status, 404);
  assert.match(out.state.body.message, /approved property/i);

  propertyExists = true;
  out = createResponse();
  await controller.createBooking(request({ body: validBooking() }), out.res);
  assert.equal(out.state.status, 404);
  assert.match(out.state.body.message, /room not found/i);
});

test('hotel booking enforces room capacity', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, partner_id FROM properties')) return [[{ id: 1, partner_id: 2 }]];
    if (sql.startsWith('SELECT id, property_id, room_type,')) return [[room({ capacity: 2 })]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createBooking(request({ body: validBooking({ guests: 3 }) }), res);
  assert.equal(state.status, 400);
  assert.match(state.body.message, /maximum 2/i);
});

test('fully booked room returns available alternatives instead of creating a booking', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, partner_id FROM properties')) return [[{ id: 1, partner_id: 2 }]];
    if (sql.startsWith('SELECT id, property_id, room_type,') && sql.includes('WHERE id = ? AND property_id = ?')) {
      return [[room({ available_rooms: 0 })]];
    }
    if (sql.startsWith('SELECT id, room_type, capacity,') && sql.includes('id <> ?')) {
      return [[{ id: 12, room_type: 'Family', capacity: 4, available_rooms: 1, price_per_night: 15000 }]];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createBooking(request({ body: validBooking() }), res);
  assert.equal(state.status, 400);
  assert.equal(state.body.suggestions.length, 1);
  assert.equal(state.body.suggestions[0].id, 12);
});

test('valid tourist booking calculates price and starts pending approval/payment', async () => {
  let insertParams;
  const { pool } = createTransactionPool(async (sql, params) => {
    if (sql.startsWith('SELECT id, name, city, partner_id FROM properties')) return [[{ id: 1, partner_id: 2 }]];
    if (sql.startsWith('SELECT id, property_id, room_type,') && sql.includes('WHERE id = ? AND property_id = ?')) return [[room()]];
    if (sql.startsWith('INSERT INTO bookings')) {
      insertParams = params;
      return [{ insertId: 101 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createBooking(request({ body: validBooking({ guests: 3 }), user: { id: 7, role: 'tourist' } }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.booking_id, 101);
  assert.equal(state.body.booking_status, 'Pending Partner Approval');
  assert.equal(state.body.payment_status, 'Pending Payment');
  // 1 night + 1 day, one extra guest: (10000+2000) + (6000+2000)
  assert.equal(state.body.total_amount, 20000);
  assert.equal(insertParams[1], 7);
  assert.equal(insertParams[2], 7);
  assert.equal(insertParams[21], 20000);
});

test('guest booking creates a private guest-session cookie', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, partner_id FROM properties')) return [[{ id: 1, partner_id: 2 }]];
    if (sql.startsWith('SELECT id, property_id, room_type,') && sql.includes('WHERE id = ? AND property_id = ?')) return [[room()]];
    if (sql.startsWith('INSERT INTO bookings')) return [{ insertId: 102 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);
  const { res, state } = createResponse();
  const req = request({ body: validBooking(), headers: {} });
  await controller.createBooking(req, res);
  assert.equal(state.status, 201);
  assert.equal(state.body.is_guest_booking, true);
  assert.match(String(state.headers['set-cookie']), /tourismhub_guest_id=/);
  assert.match(String(state.headers['set-cookie']), /HttpOnly/);
});

test('partner approval enforces ownership, state and room availability', async () => {
  let scenario = 'missing';
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT b.id, b.room_id, b.booking_status')) {
      if (scenario === 'missing') return [[]];
      if (scenario === 'approved') return [[{ id: 1, room_id: 11, booking_status: 'Approved', available_rooms: 2 }]];
      if (scenario === 'none') return [[{ id: 1, room_id: 11, booking_status: 'Pending Partner Approval', available_rooms: 0 }]];
      return [[{ id: 1, room_id: 11, booking_status: 'Pending Partner Approval', available_rooms: 2 }]];
    }
    if (sql.startsWith('UPDATE bookings')) return [{ affectedRows: 1 }];
    if (sql.startsWith('UPDATE rooms')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);

  let out = createResponse();
  await controller.approveBooking(request({ user: { id: 2 }, params: { id: '1' } }), out.res);
  assert.equal(out.state.status, 404);

  scenario = 'approved';
  out = createResponse();
  await controller.approveBooking(request({ user: { id: 2 }, params: { id: '1' } }), out.res);
  assert.equal(out.state.status, 400);

  scenario = 'none';
  out = createResponse();
  await controller.approveBooking(request({ user: { id: 2 }, params: { id: '1' } }), out.res);
  assert.equal(out.state.status, 400);

  scenario = 'valid';
  out = createResponse();
  await controller.approveBooking(request({ user: { id: 2 }, params: { id: '1' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.booking_status, 'Approved');
});

test('booking rejection and payment update apply only to owned/identifiable bookings', async () => {
  let found = true;
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT b.id, b.booking_status FROM bookings')) {
      return [found ? [{ id: 1, booking_status: 'Pending Partner Approval' }] : []];
    }
    if (sql.startsWith('SELECT b.id, b.payment_status, b.booking_status FROM bookings')) {
      return [found ? [{ id: 1, payment_status: 'Pending Payment', booking_status: 'Approved' }] : []];
    }
    if (sql.startsWith('UPDATE bookings')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('booking.controller.js', pool);

  let out = createResponse();
  await controller.rejectBooking(request({ user: { id: 2 }, params: { id: '1' }, body: { partner_note: 'Unavailable' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.booking_status, 'Rejected');

  out = createResponse();
  await controller.payOnlineBooking(request({ user: { id: 7, role: 'tourist' }, params: { id: '1' }, headers: {} }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.payment_status, 'Paid');

  found = false;
  out = createResponse();
  await controller.payOnlineBooking(request({ user: { id: 7, role: 'tourist' }, params: { id: '99' }, headers: {} }), out.res);
  assert.equal(out.state.status, 404);
});
