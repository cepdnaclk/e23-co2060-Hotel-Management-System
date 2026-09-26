import test from "node:test";
import assert from "node:assert/strict";
import { createExploreReturnStore } from "../src/utils/exploreReturn.js";
import { loadPlannerResources } from "../src/utils/loadPlannerResources.js";
import { canManageTripPlans } from "../src/utils/plannerAccess.js";

const explore = { key: "explore-1", pathname: "/explore" };
const detail = { key: "detail-1", pathname: "/explore/42" };
const snapshot = { restore: true, page: 2, search: "coast", category: "beach",
  region: "East Coast", budget: "Low", sort: "name", activeTab: "places", scrollY: 1600 };
function visitDetail() {
  const store = createExploreReturnStore();
  store.save(explore.key, detail.pathname, snapshot);
  store.commit(explore, detail);
  return store;
}

test("browser Back from the selected detail restores all Explore state", () => {
  const store = visitDetail();
  assert.deepEqual(store.resolve(detail, explore, "POP"), snapshot);
  store.commit(detail, explore);
  assert.equal(store.resolve(detail, explore, "POP"), null, "ticket is consumed");
});

test("explicit detail return link restores, but a normal Explore link does not", () => {
  const store = visitDetail();
  const backLink = { key: "explore-2", pathname: "/explore", state: store.stateForDetail(detail) };
  assert.deepEqual(store.resolve(detail, backLink, "PUSH"), snapshot);
  assert.equal(store.resolve(detail, { ...backLink, state: null }, "PUSH"), null);
  assert.equal(store.resolve(detail, { ...explore, key: "unrelated" }, "POP"), null);
});

for (const pathname of ["/", "/events", "/tourist-guides", "/hotels", "/trip-planner"]) {
  test(`${pathname} -> Explore never restores a previous detail snapshot`, () => {
    const store = visitDetail();
    const other = { key: `other:${pathname}`, pathname };
    store.commit(detail, other);
    assert.equal(store.resolve(other, explore, "PUSH"), null);
    assert.equal(store.resolve(detail, explore, "POP"), null);
  });
}

test("refresh/direct detail and unrelated detail history cannot restore", () => {
  const fresh = createExploreReturnStore();
  assert.equal(fresh.resolve(null, explore, "POP"), null);
  assert.equal(fresh.stateForDetail(detail), null);
  const store = visitDetail();
  assert.equal(store.resolve({ ...detail, key: "different-detail" }, explore, "POP"), null);
  store.commit(detail, { key: "related", pathname: "/explore/43" });
  assert.equal(store.resolve(detail, explore, "POP"), null);
});

test("a new detail visit after returning gets a fresh snapshot", () => {
  const store = visitDetail();
  store.commit(detail, explore);
  const next = { ...snapshot, page: 1, scrollY: 500 };
  store.save(explore.key, detail.pathname, next);
  store.commit(explore, detail);
  assert.deepEqual(store.resolve(detail, explore, "POP"), next);
});

const configuration = { data: { settings: { trip_planner_map: { tileUrl: "test-tile-url" } }, destinations: [{ id: 42 }] } };
const resolve = (value) => async () => value;
const reject = (error) => async () => { throw error; };

test("partner 403 preserves successful DB bootstrap and original authorization error", async () => {
  const denied = { response: { status: 403, data: { message: "Only tourists or guest users can manage trip plans." } } };
  const result = await loadPlannerResources({ bootstrap: resolve(configuration), plans: reject(denied), events: resolve([]) });
  assert.equal(result.bootstrap, configuration);
  assert.equal(result.plans.reason, denied);
  assert.equal(result.events.status, "fulfilled");
});

test("event outage is rejected data, not an empty list that removes saved items", async () => {
  const failure = new Error("Events unavailable");
  const plans = { data: [{ id: 7 }] };
  const result = await loadPlannerResources({ bootstrap: resolve(configuration), plans: resolve(plans), events: reject(failure) });
  assert.equal(result.bootstrap, configuration);
  assert.equal(result.plans.value, plans);
  assert.equal(result.events.status, "rejected");
  assert.equal(result.events.reason, failure);
});

test("tourist/guest success retains all API responses", async () => {
  const plans = { data: [] };
  const events = [{ id: 10 }];
  const result = await loadPlannerResources({ bootstrap: resolve(configuration), plans: resolve(plans), events: resolve(events) });
  assert.equal(result.bootstrap, configuration);
  assert.equal(result.plans.value, plans);
  assert.equal(result.events.value, events);
});

test("bootstrap failure is surfaced instead of inventing map settings", async () => {
  const failure = new Error("Configuration unavailable");
  await assert.rejects(loadPlannerResources({ bootstrap: reject(failure), plans: resolve({ data: [] }), events: resolve([]) }), failure);
});

test("only hydrated tourists and genuine unauthenticated guests can manage plans", () => {
  assert.equal(canManageTripPlans(false, null), false);
  assert.equal(canManageTripPlans(true, null), true);
  assert.equal(canManageTripPlans(true, { role: "tourist" }), true);
  for (const role of ["partner", "admin", "reception", "user", "customer", "guest"]) {
    assert.equal(canManageTripPlans(true, { role }), false, role);
  }
});

test("unsupported roles can load the public map without calling a restricted plans endpoint", async () => {
  const result = await loadPlannerResources({ bootstrap: resolve(configuration), events: resolve([]) });
  assert.equal(result.bootstrap, configuration);
  assert.deepEqual(result.plans, { status: "skipped" });
});
