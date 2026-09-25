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

function authController(handler) {
  const { pool, stats } = createTransactionPool(handler);
  return { controller: loadController('auth.controller.js', pool), stats };
}

function validTourist(overrides = {}) {
  return {
    full_name: 'Test Tourist',
    email: ' Tourist@Test.LK ',
    phone: '+94 71 123 4567',
    nationality: 'Sri Lankan',
    national_id: 'TEST-001',
    password: 'Strong@123',
    confirm_password: 'Strong@123',
    ...overrides,
  };
}

test('tourist registration rejects incomplete details', async () => {
  const { controller } = authController(async () => { throw new Error('DB should not be called'); });
  const { res, state } = createResponse();
  await controller.registerTourist(request({ body: { email: 'a@b.com' } }), res);
  assert.equal(state.status, 400);
  assert.equal(state.body.success, false);
});

test('tourist registration validates phone, password match and password strength', async () => {
  const { controller } = authController(async () => { throw new Error('DB should not be called'); });

  let out = createResponse();
  await controller.registerTourist(request({ body: validTourist({ phone: '0712345678' }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /country code/i);

  out = createResponse();
  await controller.registerTourist(request({ body: validTourist({ confirm_password: 'Different@123' }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /do not match/i);

  out = createResponse();
  await controller.registerTourist(request({ body: validTourist({ password: 'weak', confirm_password: 'weak' }) }), out.res);
  assert.equal(out.state.status, 400);
  assert.match(out.state.body.message, /at least 8/i);
});

test('tourist registration prevents duplicate email', async () => {
  const { controller } = authController(async (sql) => {
    if (sql.startsWith('SELECT id FROM users WHERE email = ?')) return [[{ id: 99 }]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const { res, state } = createResponse();
  await controller.registerTourist(request({ body: validTourist() }), res);
  assert.equal(state.status, 409);
  assert.match(state.body.message, /already exists/i);
});

test('tourist registration normalizes email and stores a bcrypt password hash', async () => {
  let insertParams;
  const { controller } = authController(async (sql, params) => {
    if (sql.startsWith('SELECT id FROM users WHERE email = ?')) {
      assert.equal(params[0], 'tourist@test.lk');
      return [[]];
    }
    if (sql.startsWith('INSERT INTO users')) {
      insertParams = params;
      return [{ insertId: 12 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const { res, state } = createResponse();
  await controller.registerTourist(request({ body: validTourist() }), res);
  assert.equal(state.status, 201);
  assert.equal(state.body.success, true);
  assert.equal(insertParams[1], 'tourist@test.lk');
  assert.equal(await bcrypt.compare('Strong@123', insertParams[5]), true);
});

test('login rejects missing credentials and unknown users', async () => {
  const { controller } = authController(async (sql) => {
    if (sql.startsWith('SELECT * FROM users')) return [[]];
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  let out = createResponse();
  await controller.loginTourist(request({ body: {} }), out.res);
  assert.equal(out.state.status, 400);

  out = createResponse();
  await controller.loginTourist(request({ body: { email: 'nobody@test.lk', password: 'Strong@123' } }), out.res);
  assert.equal(out.state.status, 401);
});

test('login rejects wrong password', async () => {
  const password_hash = await bcrypt.hash('Correct@123', 4);
  const { controller } = authController(async (sql) => {
    if (sql.startsWith('SELECT * FROM users')) {
      return [[{ id: 1, role: 'tourist', email: 'tourist@test.lk', password_hash, is_active: true }]];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const { res, state } = createResponse();
  await controller.loginTourist(request({ body: { email: 'tourist@test.lk', password: 'Wrong@123' } }), res);
  assert.equal(state.status, 401);
});

test('valid tourist login returns a signed role-aware JWT', async () => {
  const password_hash = await bcrypt.hash('Correct@123', 4);
  const user = {
    id: 7,
    full_name: 'Test Tourist',
    email: 'tourist@test.lk',
    phone: '+94 71 123 4567',
    nationality: 'Sri Lankan',
    national_id: null,
    role: 'tourist',
    password_hash,
    is_active: true,
  };
  const { controller } = authController(async (sql, params) => {
    if (sql.startsWith('SELECT * FROM users')) {
      assert.deepEqual(params, ['tourist@test.lk', 'tourist']);
      return [[user]];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const { res, state } = createResponse();
  await controller.loginTourist(request({ body: { email: 'TOURIST@test.lk', password: 'Correct@123' } }), res);
  assert.equal(state.status, 200);
  assert.equal(state.body.user.role, 'tourist');
  const decoded = jwt.verify(state.body.token, process.env.JWT_SECRET);
  assert.equal(decoded.id, 7);
  assert.equal(decoded.role, 'tourist');
});

test('getMe returns 404 for missing account and profile for existing account', async () => {
  let found = false;
  const { controller } = authController(async (sql, params) => {
    if (sql.includes('FROM users') && sql.includes('WHERE id = ?')) {
      return [found ? [{ id: params[0], email: 'tourist@test.lk', role: 'tourist', is_active: 1 }] : []];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  let out = createResponse();
  await controller.getMe(request({ user: { id: 7 } }), out.res);
  assert.equal(out.state.status, 404);

  found = true;
  out = createResponse();
  await controller.getMe(request({ user: { id: 7 } }), out.res);
  assert.equal(out.state.status, 200);
  assert.equal(out.state.body.user.id, 7);
});

test('authentication and role middleware reject invalid access', async () => {
  const { protect } = require('../src/middleware/auth.middleware');
  const { allowRoles } = require('../src/middleware/role.middleware');

  let out = createResponse();
  protect({ headers: {} }, out.res, () => assert.fail('next should not run'));
  assert.equal(out.state.status, 401);

  out = createResponse();
  protect({ headers: { authorization: 'Bearer bad-token' } }, out.res, () => assert.fail('next should not run'));
  assert.equal(out.state.status, 401);

  const token = jwt.sign({ id: 2, role: 'partner' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let nextCalled = false;
  out = createResponse();
  protect(req, out.res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.role, 'partner');

  out = createResponse();
  allowRoles('admin')(req, out.res, () => assert.fail('partner must not pass admin gate'));
  assert.equal(out.state.status, 403);
});
