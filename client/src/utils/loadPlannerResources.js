// A denied saved-plans request must not discard public, DB-driven map settings.
export async function loadPlannerResources({ bootstrap, plans, events }) {
  const [configuration, savedPlans, publishedEvents] = await Promise.allSettled([
    bootstrap(), plans ? plans() : Promise.resolve(), events(),
  ]);
  if (configuration.status === "rejected") throw configuration.reason;
  return { bootstrap: configuration.value, plans: plans ? savedPlans : { status: "skipped" }, events: publishedEvents };
}
