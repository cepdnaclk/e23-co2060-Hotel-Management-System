USE tourismhub_lk;

-- =========================================================
-- TOURISMHUB LK
-- SAFE EXISTING-DATABASE MIGRATION
-- SET 19 — PERMANENT TRIP-PLANNER ROUTING RESILIENCE
--
-- Run this file ONCE in MySQL Workbench on the existing DB.
-- It does NOT drop or recreate trip plans.
-- Do NOT run npm run db:setup for this update.
-- =========================================================


CREATE TABLE IF NOT EXISTS trip_route_access_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    explore_place_id INT NOT NULL,

    provider_name VARCHAR(100) NOT NULL,
    transport_profile VARCHAR(100) NOT NULL,

    source_lat DECIMAL(10,7) NOT NULL,
    source_lng DECIMAL(10,7) NOT NULL,

    routing_lat DECIMAL(10,7) NOT NULL,
    routing_lng DECIMAL(10,7) NOT NULL,

    snapped_distance_meters DECIMAL(14,2) NULL,

    source_type VARCHAR(40)
        NOT NULL
        DEFAULT 'provider_snap',

    resolution_strategy VARCHAR(80) NULL,

    verified_at DATETIME NULL,
    expires_at DATETIME NULL,
    last_used_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_trip_route_access
        UNIQUE (
            explore_place_id,
            provider_name,
            transport_profile
        ),

    CONSTRAINT fk_trip_route_access_place
        FOREIGN KEY (explore_place_id)
        REFERENCES explore_places(id)
        ON DELETE CASCADE
);


UPDATE explore_settings
SET setting_value = JSON_SET(
    setting_value,

    '$.baseUrl',
    'https://api.heigit.org/openrouteservice/v2',

    '$.requestTimeoutMs',
    15000,

    '$.routingStrategyVersion',
    'road-access-v2',

    '$.snapFallbackEnabled',
    TRUE,

    '$.snapRadiiMeters',
    JSON_ARRAY(
        500,
        2000,
        5000,
        10000,
        20000
    ),

    '$.accessPointCacheHours',
    720,

    '$.accessSearchRingKm',
    JSON_ARRAY(
        1,
        3,
        7,
        12,
        20,
        30,
        40
    ),

    '$.accessSearchBearings',
    8,

    '$.accessCandidateSnapRadiusMeters',
    2000,

    '$.accessWarningThresholdMeters',
    100
)
WHERE setting_key =
    'trip_planner_routing_provider';


SELECT
    setting_key,
    setting_value
FROM explore_settings
WHERE setting_key =
    'trip_planner_routing_provider';


SELECT
    COUNT(*) AS cached_access_points
FROM trip_route_access_points;
