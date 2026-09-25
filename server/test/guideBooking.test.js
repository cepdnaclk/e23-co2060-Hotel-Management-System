const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createResponse,
  createTransactionPool,
  loadController,
  request,
} = require('./helpers/controllerTestUtils');

function validGuide(overrides = {}) {
  return {
    full_name: 'Sahandi Test',
    display_name: 'Sahandi',
    guide_type: 'Nature',
    city: 'Kandy',
    district: 'Kandy',
    languages: ['English', 'Sinhala'],
    experience_years: 4,
    phone: '+94 71 555 5555',
    email: 'guide@test.lk',
    price_per_day: 10000,
    price_per_hour: 1000,
    services: ['Nature walks'],
    specialities: ['Kandy'],
    short_description: 'Friendly local guide.',
    bio: 'Experienced guide for automated testing.',
    ...overrides,
  };
}

function guideRow(overrides = {}) {
  return {
    id: 5,
    partner_id: 2,
    slug: 'sahandi-kandy',
    full_name: 'Sahandi Test',
    display_name: 'Sahandi',
    guide_type: 'Nature',
    city: 'Kandy',
    district: 'Kandy',
    languages: '["English","Sinhala"]',
    experience_years: 4,
    phone: '+94 71 555 5555',
    email: 'guide@test.lk',
    price_per_day: 10000,
    price_per_hour: 1000,
    services: '["Nature walks"]',
    specialities: '["Kandy"]',
    short_description: 'Friendly local guide.',
    bio: 'Experienced guide.',
    registration_fee: 3000,
    registration_payment_status: 'Paid',
    promotion_fee: 1500,
    promotion_payment_status: 'Unpaid',
    is_promoted: 0,
    status: 'approved',
    ...overrides,
  };
}

function bookingRow(overrides = {}) {
  return {
    id: 40,
    booking_reference: 'GD-TEST-001',
    guide_id: 5,
    tourist_id: 7,
    guide_name: 'Sahandi',
    partner_id: 2,
    booking_date: '2099-02-10',
    start_time: '09:00:00',
    duration_type: 'hourly',
    hours: 3,
    guests: 2,
    total_amount: 3000,
    booking_status: 'pending',
    payment_status: 'unpaid',
    review_id: null,
    ...overrides,
  };
}

test('partner guide creation validates required fields and negative prices', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run'); });
  const controller = loadController('partnerGuide.controller.js', pool);

  let out = createResponse();
  await controller.createMyGuide(request({ user: { id: 2 }, body: { full_name: 'Only name' } }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createMyGuide(request({ user: { id: 2 }, body: validGuide({ price_per_day: -1 }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /cannot be negative/i);
});

test('valid guide profile is submitted as pending with a unique slug', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id FROM partner_guides WHERE slug = ?')) return [[]];
    if (sql.startsWith('INSERT INTO partner_guides')) return [{ insertId: 5 }];
    if (sql.startsWith('SELECT * FROM partner_guides WHERE id = ?')) return [[guideRow({ status: 'pending', registration_payment_status: 'Unpaid' })]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partnerGuide.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createMyGuide(request({ user: { id: 2 }, body: validGuide() }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.guide.slug, 'sahandi-kandy');
  assert.equal(state.body.guide.status, 'pending');
});

test('guide registration payment prevents duplicate payment and succeeds for unpaid owned guide', async () => {
  let paid = true;
  const { pool, stats } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, partner_id, registration_fee')) {
      return [[guideRow({ registration_payment_status: paid ? 'Paid' : 'Unpaid' })]];
    }
    if (sql.startsWith('UPDATE partner_guides SET registration_payment_status')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO guide_payment_transactions')) return [{ insertId: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partnerGuide.controller.js', pool);

  let out = createResponse();
  await controller.payGuideRegistrationFee(request({ user: { id: 2 }, params: { id: '5' } }), out.res);
  assert.equal(out.state.status, 400);

  paid = false;
  out = createResponse();
  await controller.payGuideRegistrationFee(request({ user: { id: 2 }, params: { id: '5' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.registration_payment_status, 'Paid');
  assert.equal(stats.commit, 1);
});

test('guide promotion requires registration payment and admin approval', async () => {
  let row = guideRow({ registration_payment_status: 'Unpaid', status: 'pending' });
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, partner_id, promotion_fee')) return [[row]];
    if (sql.startsWith('UPDATE partner_guides SET promotion_payment_status')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO guide_payment_transactions')) return [{ insertId: 2 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partnerGuide.controller.js', pool);

  let out = createResponse();
  await controller.payGuidePromotionFee(request({ user: { id: 2 }, params: { id: '5' } }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /registration fee/i);

  row = guideRow({ registration_payment_status: 'Paid', status: 'pending' });
  out = createResponse();
  await controller.payGuidePromotionFee(request({ user: { id: 2 }, params: { id: '5' } }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /admin approval/i);

  row = guideRow({ registration_payment_status: 'Paid', status: 'approved' });
  out = createResponse();
  await controller.payGuidePromotionFee(request({ user: { id: 2 }, params: { id: '5' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.is_promoted, true);
});

test('guide booking validates date, duration and hourly limits before database work', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run'); });
  const controller = loadController('guideBooking.controller.js', pool, { mockGuideSchema: true });

  for (const [body, expected] of [
    [{}, 400],
    [{ guide_id: 5, booking_date: '2020-01-01' }, 400],
    [{ guide_id: 5, booking_date: '2099-02-10', duration_type: 'weeks' }, 400],
    [{ guide_id: 5, booking_date: '2099-02-10', duration_type: 'hourly', hours: 0 }, 400],
    [{ guide_id: 5, booking_date: '2099-02-10', duration_type: 'hourly', hours: 13 }, 400],
  ]) {
    const out = createResponse();
    await controller.createBooking(request({ user: { id: 7, full_name: 'Tourist' }, body }), out.res);
    assert.equal(out.state.status, expected);
  }
});

test('valid hourly guide request calculates total and starts pending/unpaid', async () => {
  const { pool, stats } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT * FROM partner_guides')) return [[guideRow()]];
    if (sql.startsWith('SELECT id FROM guide_bookings')) return [[]];
    if (sql.startsWith('INSERT INTO guide_bookings')) return [{ insertId: 40 }];
    if (sql.startsWith('INSERT INTO notifications')) return [{ insertId: 1 }];
    if (sql.includes('FROM guide_bookings gb') && sql.includes('WHERE gb.id = ?')) {
      return [[bookingRow({ total_amount: 3000 })]];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('guideBooking.controller.js', pool, { mockGuideSchema: true });
  const { res, state } = createResponse();
  await controller.createBooking(request({
    user: { id: 7, role: 'tourist', full_name: 'Tourist Test' },
    body: {
      guide_id: 5, booking_date: '2099-02-10', start_time: '09:00:00',
      duration_type: 'hourly', hours: 3, guests: 2,
    },
  }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.booking.total_amount, 3000);
  assert.equal(stats.commit, 1);
});

test('guide booking cannot be paid until partner approves it', async () => {
  let booking = bookingRow({ booking_status: 'pending' });
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.includes('FROM guide_bookings gb') && sql.includes('gb.tourist_id = ?')) return [[booking]];
    if (sql.startsWith('INSERT INTO guide_booking_payments')) return [{ insertId: 9 }];
    if (sql.startsWith('UPDATE guide_bookings SET payment_status')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO notifications')) return [{ insertId: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('guideBooking.controller.js', pool, { mockGuideSchema: true });

  let out = createResponse();
  await controller.payBooking(request({ user: { id: 7 }, params: { id: '40' }, body: { card_last4: '1234' } }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /approve/i);

  booking = bookingRow({ booking_status: 'approved', payment_status: 'unpaid' });
  out = createResponse();
  await controller.payBooking(request({ user: { id: 7 }, params: { id: '40' }, body: { card_last4: '1234' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.match(out.state.body.message, /confirmed/i);
});

test('partner approval blocks conflicting accepted guide bookings', async () => {
  let conflict = true;
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.includes('FROM guide_bookings gb') && sql.includes('pg.partner_id = ?')) {
      return [[bookingRow({ booking_status: 'pending' })]];
    }
    if (sql.startsWith('SELECT id FROM guide_bookings')) return [conflict ? [{ id: 99 }] : []];
    if (sql.startsWith('UPDATE guide_bookings SET booking_status = \'approved\'')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO notifications')) return [{ insertId: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('guideBooking.controller.js', pool, { mockGuideSchema: true });

  let out = createResponse();
  await controller.updatePartnerStatus(request({ user: { id: 2 }, params: { id: '40' }, body: { status: 'approved' } }), out.res);
  assert.equal(out.state.status, 409);

  conflict = false;
  out = createResponse();
  await controller.updatePartnerStatus(request({ user: { id: 2 }, params: { id: '40' }, body: { status: 'approved' } }), out.res);
  assert.equal(out.state.status, 200);
});

test('guide cancellation refuses completed trips and refunds paid active bookings', async () => {
  let booking = bookingRow({ booking_status: 'completed', payment_status: 'paid' });
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.includes('FROM guide_bookings gb') && sql.includes('gb.tourist_id = ?')) return [[booking]];
    if (sql.startsWith('UPDATE guide_bookings SET booking_status = \'cancelled\'')) return [{ affectedRows: 1 }];
    if (sql.startsWith('UPDATE guide_booking_payments SET status = \'Refunded\'')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO notifications')) return [{ insertId: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('guideBooking.controller.js', pool, { mockGuideSchema: true });

  let out = createResponse();
  await controller.cancelBooking(request({ user: { id: 7 }, params: { id: '40' } }), out.res);
  assert.equal(out.state.status, 400);

  booking = bookingRow({ booking_status: 'confirmed', payment_status: 'paid' });
  out = createResponse();
  await controller.cancelBooking(request({ user: { id: 7 }, params: { id: '40' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.match(out.state.body.message, /cancelled/i);
});

test('guide review requires rating 1-5, completed trip and only one review', async () => {
  let booking = bookingRow({ booking_status: 'confirmed', review_id: null });
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.includes('FROM guide_bookings gb') && sql.includes('gb.tourist_id = ?')) return [[booking]];
    if (sql.startsWith('INSERT INTO guide_reviews')) return [{ insertId: 1 }];
    if (sql.startsWith('UPDATE partner_guides pg SET rating')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('guideBooking.controller.js', pool, { mockGuideSchema: true });

  let out = createResponse();
  await controller.createReview(request({ user: { id: 7 }, params: { id: '40' }, body: { rating: 6 } }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createReview(request({ user: { id: 7 }, params: { id: '40' }, body: { rating: 5 } }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /after the trip/i);

  booking = bookingRow({ booking_status: 'completed', review_id: 22 });
  out = createResponse();
  await controller.createReview(request({ user: { id: 7 }, params: { id: '40' }, body: { rating: 5 } }), out.res);
  assert.equal(out.state.status, 409);

  booking = bookingRow({ booking_status: 'completed', review_id: null });
  out = createResponse();
  await controller.createReview(request({ user: { id: 7 }, params: { id: '40' }, body: { rating: 5, comment: 'Excellent guide' } }), out.res);
  assert.equal(out.state.status, 201);
});
