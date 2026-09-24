// In-memory SQL adapter for controller tests. This does not replace a real MySQL integration test.
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const express = require('express');
function fixture() {
  const state = { events: [{ id: 7, slug: 'kandy-event', title: 'Kandy cultural evening', status: 'approved', partner_id: 2, city: 'Kandy', category: 'Cultural & Religious', explore_place_id: 3 }], reports: [], history: [], moderation: [], notifications: [] };
  let snapshot, failNotification = false;
  const calls = [];
  const query = async (sql, params = []) => {
    const q = sql.replace(/\s+/g, ' ').trim(); calls.push({ sql: q, params });
    const rows = r => [structuredClone(r)];
    const changes = () => [{ affectedRows: 1 }];
    if (q.startsWith('SELECT id, title') && q.includes('FROM tourist_events')) return rows(state.events.filter(e => e.id === Number(params[0])));
    if (q.startsWith('SELECT id, partner_id, title FROM tourist_events')) return rows(state.events.filter(e => e.id === Number(params[0])));
    if (q.startsWith('SELECT is_hidden FROM event_moderation')) return rows(state.moderation.filter(m => m.event_id === Number(params[0])));
    if (q.startsWith('SELECT event_id FROM event_moderation')) return rows(state.moderation.filter(m => m.event_id === Number(params[0]) && m.is_hidden));
    if (q.startsWith('SELECT id FROM event_reports')) return rows(state.reports.filter(r => r.event_id === Number(params[0]) && r.reporter_id === params[1] && ['submitted', 'under_review'].includes(r.status)));
    if (q.startsWith('INSERT INTO event_reports')) {
      const id = state.reports.length + 1;
      state.reports.push({ id, event_id: Number(params[0]), event_title: params[1], reporter_id: params[2], reason: params[3], details: params[4], status: 'submitted', version: 1, admin_response: null, created_at: '2026-09-22T10:00:00Z', updated_at: '2026-09-22T10:00:00Z', resolved_at: null });
      return [{ insertId: id }];
    }
    if (q.startsWith('INSERT INTO event_report_history')) {
      state.history.push({ id: state.history.length + 1, report_id: params[0], actor_id: params[1], status: params[2] || 'submitted', response: params[3] || null, visibility_action: params[4] || 'unchanged', moderation_reason: params[5] || null, created_at: '2026-09-22T10:00:00Z' }); return changes();
    }
    if (q.startsWith('SELECT event_id FROM event_reports') || q.startsWith('SELECT * FROM event_reports')) return rows(state.reports.filter(r => r.id === Number(params[0])));
    if (q.startsWith('INSERT INTO event_moderation')) {
      const m = { event_id: params[0], is_hidden: params[1], reason: params[2], moderated_by: params[3] };
      const i = state.moderation.findIndex(x => x.event_id === m.event_id); if (i < 0) state.moderation.push(m); else state.moderation[i] = m;
      return changes();
    }
    if (q.startsWith('UPDATE event_reports SET')) {
      const r = state.reports.find(x => x.id === params[3]); Object.assign(r, { status: params[0], admin_response: params[1], reviewed_by: params[2], version: r.version + 1, resolved_at: ['resolved','dismissed'].includes(params[0]) ? '2026-09-22T10:00:00Z' : null }); return changes();
    }
    if (q.startsWith('INSERT INTO notifications')) {
      if (failNotification) throw Error('Simulated notification failure');
      state.notifications.push(params); return changes();
    }
    if (q.startsWith('SELECT COUNT(*) AS total FROM event_reports') || q.startsWith('SELECT r.id, r.event_id')) {
      let result = state.reports.map(r => { const e = state.events.find(e => e.id === r.event_id); const m = state.moderation.find(m => m.event_id === r.event_id); return { ...r, event_slug: e?.slug || null, event_status: e?.status || null, event_hidden: m?.is_hidden || 0, reporter_name: 'Test tourist' }; });
      let index = 0;
      if (q.includes('WHERE r.id = ?')) { const id = Number(params[index++]); result = result.filter(r => r.id === id); }
      if (q.includes('r.reporter_id = ?')) { const owner = params[index++]; result = result.filter(r => r.reporter_id === owner); }
      if (q.includes('r.status = ?')) { const status = params[index++]; result = result.filter(r => r.status === status); }
      if (q.startsWith('SELECT COUNT')) return [[{ total: result.length }]];
      result.forEach(r => { delete r.reporter_id; delete r.reviewed_by; if (!q.includes('AS reporter_name')) delete r.reporter_name; });
      if (q.includes('OFFSET ?')) result = result.reverse().slice(params.at(-1), params.at(-1) + 20);
      return rows(result);
    }
    if (q.startsWith('SELECT id, status, response, created_at')) return rows(state.history.filter(h => h.report_id === Number(params[0])).map(h => {
      const r = { id: h.id, status: h.status, response: h.response, created_at: h.created_at };
      if (q.includes('moderation_reason')) Object.assign(r, { visibility_action: h.visibility_action, moderation_reason: h.moderation_reason }); return r;
    }));
    if (q.startsWith('SELECT e.* FROM tourist_events e')) {
      // Assert every public route contains both approval and moderation gates.
      assert.ok(q.includes("e.status IN ('approved', 'published')"));
      assert.ok(q.includes('NOT EXISTS (SELECT 1 FROM event_moderation'));
      let result = state.events.filter(e => ['approved','published'].includes(e.status) && !state.moderation.some(m => m.event_id === e.id && m.is_hidden));
      if (q.includes('e.slug = ?')) result = result.filter(e => e.slug === params[0]);
      if (q.includes('e.explore_place_id = ?')) result = result.filter(e => e.explore_place_id === Number(params[0]));
      return rows(result);
    }
    if (q.startsWith("UPDATE tourist_events SET status = 'approved'")) { state.events.find(e => e.id === Number(params[1])).status = 'approved'; return changes(); }
    throw Error(`Unhandled SQL in test: ${q}`);
  };
  const connection = { query, beginTransaction: async () => { snapshot = structuredClone(state); }, commit: async () => { snapshot = null; }, rollback: async () => { if (snapshot) Object.assign(state, snapshot); snapshot = null; }, release() {} };
  const pool = { query, getConnection: async () => connection };
  const dbPath = require.resolve('../../src/config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: pool };
  for (const name of ['controllers/eventReport.controller','controllers/touristEvent.controller','controllers/adminEvent.controller','routes/eventReport.routes','routes/touristEvent.routes','routes/adminEvent.routes']) delete require.cache[require.resolve('../../src/' + name)];
  const app = express(); app.use(express.json());
  const { touristReports, adminReports } = require('../../src/routes/eventReport.routes');
  app.use('/api/reports', touristReports); app.use('/api/admin/reports', adminReports);
  app.use('/api/tourist', require('../../src/routes/touristEvent.routes'));
  app.use('/api/admin/events', require('../../src/routes/adminEvent.routes'));
  return { app, state, calls, setFailNotification(value) { failNotification = value; } };
}
async function startFixture() {
  process.env.JWT_SECRET = 'event-reports-test-secret-only';
  const f = fixture();
  const server = await new Promise(resolve => { const s = f.app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const token = (id = 1, role = 'tourist') => jwt.sign({ id, role }, process.env.JWT_SECRET);
  const request = async (url, { method = 'GET', user = 1, role = 'tourist', body, authorization } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (user !== null) headers.Authorization = authorization || `Bearer ${token(user, role)}`;
    const response = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  return { ...f, request, close: () => new Promise(resolve => server.close(resolve)) };
}
module.exports = { startFixture };
