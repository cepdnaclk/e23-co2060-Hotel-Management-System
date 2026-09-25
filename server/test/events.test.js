const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createResponse,
  createTransactionPool,
  loadController,
  request,
} = require('./helpers/controllerTestUtils');

function validEvent(overrides = {}) {
  return {
    property_id: 10,
    title: 'Kandy Cultural Evening',
    category: 'Culture',
    city: 'Kandy',
    district: 'Kandy',
    venue: 'Lake Road',
    month_name: 'October',
    month_number: 10,
    event_date: '2099-10-15',
    date_label: '15 October 2099',
    time_label: '6:00 PM',
    price_type: 'Paid',
    price: 3500,
    duration: '3 hours',
    short_description: 'A cultural evening in Kandy.',
    description: 'A longer description for automated event testing.',
    highlights: ['Dance', 'Music'],
    near_hotels: ['Test Hotel'],
    ...overrides,
  };
}

function eventRow(overrides = {}) {
  return {
    id: 20,
    slug: 'kandy-cultural-evening',
    partner_id: 2,
    property_id: 10,
    title: 'Kandy Cultural Evening',
    category: 'Culture',
    city: 'Kandy',
    district: 'Kandy',
    venue: 'Lake Road',
    month_name: 'October',
    month_number: 10,
    event_date: '2099-10-15',
    date_label: '15 October 2099',
    time_label: '6:00 PM',
    price_type: 'Paid',
    price: 3500,
    duration: '3 hours',
    short_description: 'A cultural evening.',
    description: 'Full event description.',
    near_hotels: '[]',
    highlights: '["Dance","Music"]',
    guide_recommended: 0,
    featured: 0,
    status: 'pending',
    property_name: 'Test Hotel',
    ...overrides,
  };
}

test('partner event creation validates required content, price type and price', async () => {
  const { pool } = createTransactionPool(async () => { throw new Error('DB should not run'); });
  const controller = loadController('partnerEvent.controller.js', pool);

  let out = createResponse();
  await controller.createMyPartnerEvent(request({ user: { id: 2 }, body: { title: 'Only title' } }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createMyPartnerEvent(request({ user: { id: 2 }, body: validEvent({ price_type: 'Invalid' }) }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.createMyPartnerEvent(request({ user: { id: 2 }, body: validEvent({ price: -1 }) }), out.res);
  assert.equal(out.state.status, 400);
});

test('partner event cannot use a property owned by another partner', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, district, address FROM properties')) return [[]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partnerEvent.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createMyPartnerEvent(request({ user: { id: 2 }, body: validEvent() }), res);
  assert.equal(state.status, 400);
  assert.match(state.body.message, /does not belong/i);
});

test('valid partner event receives a unique slug and pending status', async () => {
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, name, city, district, address FROM properties')) {
      return [[{ id: 10, name: 'Test Hotel', city: 'Kandy', district: 'Kandy' }]];
    }
    if (sql.startsWith('SELECT id FROM tourist_events WHERE slug = ?')) return [[]];
    if (sql.startsWith('INSERT INTO tourist_events')) return [{ insertId: 20 }];
    if (sql.startsWith('SELECT e.*, p.name AS property_name')) return [[eventRow()]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partnerEvent.controller.js', pool);
  const { res, state } = createResponse();
  await controller.createMyPartnerEvent(request({ user: { id: 2 }, body: validEvent() }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.event.slug, 'kandy-cultural-evening');
  assert.equal(state.body.event.status, 'pending');
});

test('partner can hide only an approved event and can resubmit as pending', async () => {
  let currentStatus = 'pending';
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, status FROM tourist_events')) return [[{ id: 20, status: currentStatus }]];
    if (sql.startsWith('UPDATE tourist_events SET')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('partnerEvent.controller.js', pool);

  let out = createResponse();
  await controller.updateMyPartnerEventStatus(request({ user: { id: 2 }, params: { id: '20' }, body: { status: 'hidden' } }), out.res);
  assert.equal(out.state.status, 400);

  currentStatus = 'approved';
  out = createResponse();
  await controller.updateMyPartnerEventStatus(request({ user: { id: 2 }, params: { id: '20' }, body: { status: 'hidden' } }), out.res);
  assert.equal(out.state.status, 200);

  currentStatus = 'rejected';
  out = createResponse();
  await controller.updateMyPartnerEventStatus(request({ user: { id: 2 }, params: { id: '20' }, body: { status: 'pending' } }), out.res);
  assert.equal(out.state.status, 200);
});

test('admin approval refuses missing events and moderation-held events', async () => {
  let scenario = 'missing';
  const { pool } = createTransactionPool(async (sql) => {
    if (sql.startsWith('SELECT id, partner_id, title FROM tourist_events')) {
      return [scenario === 'missing' ? [] : [{ id: 20, partner_id: 2, title: 'Kandy Cultural Evening' }]];
    }
    if (sql.startsWith('SELECT event_id FROM event_moderation')) {
      return [scenario === 'held' ? [{ event_id: 20 }] : []];
    }
    if (sql.startsWith("UPDATE tourist_events SET status = 'approved'")) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO notifications')) return [{ insertId: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('adminEvent.controller.js', pool);

  let out = createResponse();
  await controller.approveEvent(request({ user: { id: 1 }, params: { id: '20' } }), out.res);
  assert.equal(out.state.status, 404);

  scenario = 'held';
  out = createResponse();
  await controller.approveEvent(request({ user: { id: 1 }, params: { id: '20' } }), out.res);
  assert.equal(out.state.status, 409);

  scenario = 'valid';
  out = createResponse();
  await controller.approveEvent(request({ user: { id: 1 }, params: { id: '20' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.data.status, 'approved');
});

test('admin event rejection requires a reason and notifies the partner', async () => {
  const { pool, stats } = createTransactionPool(async (sql, params) => {
    if (sql.startsWith('SELECT id, partner_id, title FROM tourist_events')) {
      return [[{ id: 20, partner_id: 2, title: 'Kandy Cultural Evening' }]];
    }
    if (sql.startsWith("UPDATE tourist_events SET status = 'rejected'")) {
      assert.equal(params[0], 'Incomplete safety details');
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT INTO notifications')) return [{ insertId: 1 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const controller = loadController('adminEvent.controller.js', pool);

  let out = createResponse();
  await controller.rejectEvent(request({ user: { id: 1 }, params: { id: '20' }, body: {} }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.rejectEvent(request({ user: { id: 1 }, params: { id: '20' }, body: { rejection_reason: ' Incomplete safety details ' } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(stats.commit, 1);
});
