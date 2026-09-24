const test = require('node:test');
const assert = require('node:assert/strict');
const { startFixture } = require('./helpers/reportFixture');
const submission = { event_id: 7, reason: 'incorrect_information', details: 'The time on this listing is incorrect.' };
const submit = f => f.request('/reports', { method: 'POST', body: submission });
const review = (f, body) => f.request('/admin/reports/1', { method: 'PATCH', user: 3, role: 'admin', body });
async function setup(t) { const f = await startFixture(); t.after(() => f.close()); return f; }

test('authentication and role checks protect all report APIs', async t => {
  const f = await setup(t);
  assert.equal((await f.request('/reports', { user: null })).status, 401);
  assert.equal((await f.request('/reports', { authorization: 'Bearer bad-token' })).status, 401);
  for (const role of ['partner', 'tourist']) {
    assert.equal((await f.request('/admin/reports', { role })).status, 403);
    assert.equal((await f.request('/admin/reports/1', { method: 'PATCH', role, body: {} })).status, 403);
  }
  assert.equal((await f.request('/reports', { role: 'partner', method: 'POST', body: submission })).status, 403);
  assert.equal(f.state.reports.length, 0);
});
test('submission validation, duplicates, history and ownership', async t => {
  const f = await setup(t);
  for (const bad of [{ ...submission, reason: 'unknown' }, { ...submission, details: 'short' }, { ...submission, details: 'x'.repeat(3001) }, { ...submission, event_id: '7 OR 1=1' }]) {
    assert.equal((await f.request('/reports', { method: 'POST', body: bad })).status, 400);
  }
  const created = await submit(f); assert.equal(created.status, 201); assert.equal(created.data.report.id, 1);
  assert.equal((await submit(f)).status, 409); assert.equal(f.state.reports.length, 1);
  assert.equal((await f.request('/reports/1', { user: 4 })).status, 404);
  assert.deepEqual((await f.request('/reports', { user: 4 })).data.reports, []);
  const own = await f.request('/reports/1'); assert.equal(own.data.report.history[0].status, 'submitted');
  assert.equal(own.data.report.reporter_id, undefined);
  assert.equal((await f.request('/reports?status=wrong')).status, 400);
  assert.equal((await f.request('/reports?page=-1')).status, 400);
});
test('report status transitions, public responses, version conflict and reopening', async t => {
  const f = await setup(t); await submit(f);
  assert.equal((await review(f, { status: 'resolved', version: 1, admin_response: 'We have corrected the event time.' })).status, 400);
  assert.equal((await review(f, { status: 'under_review', version: 1, admin_response: 'We are checking the time with the organiser.' })).status, 200);
  assert.equal((await review(f, { status: 'resolved', version: 1, admin_response: 'The time has now been corrected.' })).status, 409);
  assert.equal((await review(f, { status: 'resolved', version: 2, admin_response: '' })).status, 400);
  assert.equal((await review(f, { status: 'resolved', version: 2, admin_response: 'The time has now been corrected.' })).status, 200);
  let report = (await f.request('/reports/1')).data.report;
  assert.equal(report.status, 'resolved'); assert.equal(report.history.length, 3); assert.ok(report.resolved_at);
  assert.equal((await review(f, { status: 'under_review', version: 3, admin_response: 'Reopened after new information.' })).status, 200);
  report = (await f.request('/reports/1')).data.report; assert.equal(report.resolved_at, null);
  assert.equal(f.state.notifications.length, 3);
});
test('hide removes events from list, direct detail and place routes; edits and approval cannot bypass the hold', async t => {
  const f = await setup(t); await submit(f);
  const body = { status: 'under_review', version: 1, visibility_action: 'hide', moderation_reason: 'Checking whether this event has been cancelled.' };
  assert.equal((await review(f, body)).status, 200);
  assert.deepEqual((await f.request('/tourist/events')).data.events, []);
  assert.equal((await f.request('/tourist/events/kandy-event')).status, 404);
  assert.deepEqual((await f.request('/tourist/events/by-place/3')).data.events, []);
  assert.equal((await submit(f)).status, 404);
  assert.equal((await f.request('/admin/events/7/approve', { method: 'PUT', user: 3, role: 'admin' })).status, 409);
  f.state.events[0].status = 'pending'; // The result of a partner edit/resubmission.
  assert.equal((await review(f, { ...body, version: 2, visibility_action: 'restore' })).status, 200);
  assert.deepEqual((await f.request('/tourist/events')).data.events, []); // Restoring never approves pending data.
  assert.equal((await f.request('/admin/events/7/approve', { method: 'PUT', user: 3, role: 'admin' })).status, 200);
  assert.equal((await f.request('/tourist/events/kandy-event')).status, 200);
  const own = (await f.request('/reports/1')).data.report;
  assert.equal(own.history[1].moderation_reason, undefined);
  const admin = (await f.request('/admin/reports/1', { user: 3, role: 'admin' })).data.report;
  assert.equal(admin.history[1].moderation_reason, body.moderation_reason);
});
test('failed notification rolls back status, visibility and history together', async t => {
  const f = await setup(t); await submit(f); f.setFailNotification(true);
  const original = console.error; console.error = () => {};
  try { assert.equal((await review(f, { status: 'under_review', version: 1, visibility_action: 'hide', moderation_reason: 'Investigating incorrect event information.' })).status, 500); }
  finally { console.error = original; }
  assert.equal(f.state.reports[0].status, 'submitted'); assert.equal(f.state.reports[0].version, 1);
  assert.equal(f.state.history.length, 1); assert.equal(f.state.moderation.length, 0);
});
test('deleted event keeps its report reviewable, and dismissed report requires a response', async t => {
  const f = await setup(t); await submit(f);
  f.state.events = []; f.state.reports[0].event_id = null; // MySQL ON DELETE SET NULL.
  assert.equal((await review(f, { status: 'dismissed', version: 1, admin_response: 'The organiser has removed this event.' })).status, 200);
  const report = (await f.request('/reports/1')).data.report;
  assert.equal(report.event_title, 'Kandy cultural evening');
  assert.equal(report.history.length, 2); assert.equal(report.event_id, null);
  assert.equal((await review(f, { status: 'under_review', version: 2, visibility_action: 'hide', moderation_reason: 'This event has been removed already.' })).status, 409);
});

test('pagination and status filters do not leak another tourist’s reports', async t => {
  const f = await setup(t); await submit(f);
  const initial = structuredClone(f.state.reports[0]);
  f.state.reports = Array.from({ length: 26 }, (_, i) => ({ ...initial, id: i + 1, reporter_id: i === 25 ? 4 : 1, status: i === 0 ? 'resolved' : 'submitted' }));
  const first = await f.request('/reports'); assert.equal(first.data.total, 25); assert.equal(first.data.reports.length, 20);
  const second = await f.request('/reports?page=2'); assert.equal(second.data.reports.length, 5);
  assert.equal((await f.request('/reports?status=resolved')).data.reports.length, 1);
  assert.equal((await f.request('/reports/26')).status, 404);
  assert.equal((await f.request('/admin/reports', { user: 3, role: 'admin' })).data.total, 26);
});
