-- TripLanka
-- SET 18.1 — Routable-road snap fallback
--
-- SAFE CONFIG UPDATE ONLY.
-- Do NOT run npm run db:setup.
--
-- This enables progressive road-network snapping only when a destination
-- coordinate cannot be routed directly by the selected road profile.

UPDATE explore_settings
SET setting_value = JSON_SET(
    setting_value,
    '$.snapFallbackEnabled',
    TRUE,
    '$.snapRadiiMeters',
    JSON_ARRAY(1000, 3000, 8000)
)
WHERE setting_key = 'trip_planner_routing_provider';

SELECT
    setting_key,
    setting_value
FROM explore_settings
WHERE setting_key = 'trip_planner_routing_provider';
