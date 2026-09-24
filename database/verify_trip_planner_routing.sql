USE tourismhub_lk;

SELECT
    setting_key,
    setting_value
FROM explore_settings
WHERE setting_key IN (
    'trip_planner_config',
    'trip_planner_transport_profiles',
    'trip_planner_optimization_modes',
    'trip_planner_routing_provider'
);

SELECT
    ep.name,
    rap.provider_name,
    rap.transport_profile,
    rap.source_type,
    rap.source_lat,
    rap.source_lng,
    rap.routing_lat,
    rap.routing_lng,
    rap.snapped_distance_meters,
    rap.verified_at,
    rap.expires_at,
    rap.last_used_at
FROM trip_route_access_points rap
JOIN explore_places ep
    ON ep.id = rap.explore_place_id
ORDER BY rap.updated_at DESC;
