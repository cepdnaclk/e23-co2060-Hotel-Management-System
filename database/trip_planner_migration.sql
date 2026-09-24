USE tourismhub_lk;

-- =========================================================
-- TOURISMHUB LK
-- DATABASE DRIVEN TRIP PLANNER
-- =========================================================


-- =========================================================
-- 1. TRIP PLANS
-- One saved trip belongs either to a logged-in tourist
-- or to a server-created guest session.
-- =========================================================

CREATE TABLE IF NOT EXISTS trip_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,
    guest_session_id VARCHAR(100) NULL,

    title VARCHAR(180) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    travel_style VARCHAR(100) NULL,
    budget_level VARCHAR(100) NULL,

    daily_budget_target DECIMAL(12,2) NULL,

    traveller_count INT NOT NULL DEFAULT 1,

    optimization_mode VARCHAR(100) NULL,
    transport_profile VARCHAR(100) NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_trip_plans_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_trip_owner
        CHECK (
            user_id IS NOT NULL
            OR guest_session_id IS NOT NULL
        ),

    CONSTRAINT chk_trip_dates
        CHECK (
            end_date >= start_date
        ),

    CONSTRAINT chk_trip_travellers
        CHECK (
            traveller_count > 0
        )
);


-- =========================================================
-- 2. TRIP DAYS
-- Each trip contains ordered days.
-- A day can be locked when it contains a fixed booking/event.
-- =========================================================

CREATE TABLE IF NOT EXISTS trip_plan_days (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    trip_plan_id BIGINT NOT NULL,

    day_number INT NOT NULL,

    trip_date DATE NOT NULL,

    notes TEXT NULL,

    is_locked BOOLEAN NOT NULL DEFAULT FALSE,

    lock_reason VARCHAR(255) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_trip_days_plan
        FOREIGN KEY (trip_plan_id)
        REFERENCES trip_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_trip_day_number
        UNIQUE (
            trip_plan_id,
            day_number
        ),

    CONSTRAINT uq_trip_day_date
        UNIQUE (
            trip_plan_id,
            trip_date
        ),

    CONSTRAINT chk_trip_day_number
        CHECK (
            day_number > 0
        )
);


-- =========================================================
-- 3. TRIP PLAN ITEMS
--
-- Everything added to a day is stored here:
--
-- destination -> explore_places
-- hotel       -> properties
-- event       -> tourist_events
-- guide       -> partner_guides
--
-- Nothing needs to exist as a hardcoded JS object.
-- =========================================================

CREATE TABLE IF NOT EXISTS trip_plan_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    trip_day_id BIGINT NOT NULL,

    item_type VARCHAR(50) NOT NULL,

    explore_place_id INT NULL,
    property_id INT NULL,
    tourist_event_id INT NULL,
    partner_guide_id INT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    is_fixed BOOLEAN NOT NULL DEFAULT FALSE,

    fixed_start_at DATETIME NULL,
    fixed_end_at DATETIME NULL,

    notes TEXT NULL,


    -- -----------------------------------------------------
    -- Snapshot values
    --
    -- If an admin later edits/deletes an original record,
    -- an already-saved trip can still display what the
    -- tourist originally selected.
    -- -----------------------------------------------------

    source_name_snapshot VARCHAR(180) NULL,

    source_city_snapshot VARCHAR(100) NULL,

    source_district_snapshot VARCHAR(100) NULL,

    estimated_cost_snapshot DECIMAL(12,2) NULL,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_trip_item_day
        FOREIGN KEY (trip_day_id)
        REFERENCES trip_plan_days(id)
        ON DELETE CASCADE,


    CONSTRAINT fk_trip_item_place
        FOREIGN KEY (explore_place_id)
        REFERENCES explore_places(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_trip_item_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_trip_item_event
        FOREIGN KEY (tourist_event_id)
        REFERENCES tourist_events(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_trip_item_guide
        FOREIGN KEY (partner_guide_id)
        REFERENCES partner_guides(id)
        ON DELETE SET NULL,


    CONSTRAINT chk_trip_item_sort
        CHECK (
            sort_order >= 0
        )
);


-- =========================================================
-- 4. ROUTE CACHE
--
-- Real routing information is NOT hardcoded.
--
-- Backend asks the routing service:
--
-- Place A -> Place B
--
-- Then stores:
--
-- road distance
-- road duration
-- road geometry
--
-- inside MySQL.
--
-- If same route is needed again we can reuse cache.
-- =========================================================

CREATE TABLE IF NOT EXISTS trip_route_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cache_key CHAR(64) NOT NULL UNIQUE,

    origin_place_id INT NOT NULL,

    destination_place_id INT NOT NULL,

    origin_lat DECIMAL(10,7) NOT NULL,
    origin_lng DECIMAL(10,7) NOT NULL,

    destination_lat DECIMAL(10,7) NOT NULL,
    destination_lng DECIMAL(10,7) NOT NULL,

    provider_name VARCHAR(100) NOT NULL,

    transport_profile VARCHAR(100) NOT NULL,

    distance_meters DECIMAL(14,2) NULL,

    duration_seconds DECIMAL(14,2) NULL,

    route_geometry JSON NULL,

    expires_at DATETIME NULL,

    last_used_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_route_cache_origin
        FOREIGN KEY (origin_place_id)
        REFERENCES explore_places(id)
        ON DELETE CASCADE,


    CONSTRAINT fk_route_cache_destination
        FOREIGN KEY (destination_place_id)
        REFERENCES explore_places(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. ROUTING ACCESS POINT CACHE
--
-- explore_places.lat/lng remains the real map / POI point.
--
-- Parks, viewpoints, beaches, trails and restricted areas
-- may not be directly reachable by a car-routing graph.
-- The backend can derive a nearby connected road-access
-- coordinate from the live routing provider and cache it here.
--
-- No road distance or travel time is hardcoded.
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


-- =========================================================
-- 6. SAVED ROUTE ANALYSIS
--
-- Keeps the most recent optimization result.
--
-- Useful for:
-- reload
-- PDF export
-- saved trips
-- comparison
-- debugging
-- =========================================================

CREATE TABLE IF NOT EXISTS trip_route_analyses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    trip_plan_id BIGINT NOT NULL,

    provider_name VARCHAR(100) NULL,

    transport_profile VARCHAR(100) NULL,

    optimization_mode VARCHAR(100) NULL,

    current_distance_meters DECIMAL(14,2) NULL,

    current_duration_seconds DECIMAL(14,2) NULL,

    optimized_distance_meters DECIMAL(14,2) NULL,

    optimized_duration_seconds DECIMAL(14,2) NULL,

    current_order JSON NULL,

    optimized_order JSON NULL,

    route_geometry JSON NULL,

    input_hash CHAR(64) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_route_analysis_plan
        FOREIGN KEY (trip_plan_id)
        REFERENCES trip_plans(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 7. INDEXES
-- =========================================================

CREATE INDEX idx_trip_plans_user
    ON trip_plans(user_id);


CREATE INDEX idx_trip_plans_guest
    ON trip_plans(guest_session_id);


CREATE INDEX idx_trip_plans_dates
    ON trip_plans(start_date, end_date);


CREATE INDEX idx_trip_days_plan
    ON trip_plan_days(trip_plan_id);


CREATE INDEX idx_trip_items_day
    ON trip_plan_items(trip_day_id);


CREATE INDEX idx_trip_items_place
    ON trip_plan_items(explore_place_id);


CREATE INDEX idx_trip_items_property
    ON trip_plan_items(property_id);


CREATE INDEX idx_trip_items_event
    ON trip_plan_items(tourist_event_id);


CREATE INDEX idx_trip_items_guide
    ON trip_plan_items(partner_guide_id);


CREATE INDEX idx_route_cache_places
    ON trip_route_cache(
        origin_place_id,
        destination_place_id
    );


CREATE INDEX idx_route_cache_expiry
    ON trip_route_cache(expires_at);


CREATE INDEX idx_route_access_expiry
    ON trip_route_access_points(expires_at);


CREATE INDEX idx_route_analysis_plan
    ON trip_route_analyses(trip_plan_id);

-- =========================================================
-- TRIP PLANNER DATABASE CONFIGURATION
-- =========================================================

INSERT INTO explore_settings
(
    setting_key,
    setting_value
)
VALUES

-- ---------------------------------------------------------
-- GENERAL TRIP PLANNER CONFIGURATION
-- ---------------------------------------------------------

(
    'trip_planner_config',
    CAST(
        '{
            "maxDays": 30,
            "maxDestinationsPerDay": 10,
            "routeCacheHours": 24,
            "requireCoordinatesForPublishedPlaces": true
        }'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- TRANSPORT PROFILES
-- ---------------------------------------------------------

(
    'trip_planner_transport_profiles',
    CAST(
        '[
            {
                "key": "car",
                "label": "Car / Taxi",
                "providerProfile": "driving-car"
            }
        ]'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- ROUTE OPTIMIZATION MODES
-- ---------------------------------------------------------

(
    'trip_planner_optimization_modes',
    CAST(
        '[
            {
                "key": "fastest",
                "label": "Less travel time",
                "metric": "duration",
                "providerPreference": "fastest"
            },
            {
                "key": "shortest",
                "label": "Less travel distance",
                "metric": "distance",
                "providerPreference": "shortest"
            }
        ]'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- MAP CONFIGURATION
-- ---------------------------------------------------------

(
    'trip_planner_map',
    CAST(
        '{
            "engine": "leaflet",
            "provider": "openstreetmap",
            "tileUrl": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "attribution": "© OpenStreetMap contributors",
            "center": [80.7718, 7.8731],
            "zoom": 7,
            "minZoom": 5,
            "maxZoom": 18
        }'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- ROAD ROUTING PROVIDER
-- ---------------------------------------------------------

(
    'trip_planner_routing_provider',
    CAST(
        '{
            "key": "openrouteservice",
            "enabled": true,
            "baseUrl": "https://api.heigit.org/openrouteservice/v2",
            "requestTimeoutMs": 15000,
            "routingStrategyVersion": "road-access-v2",
            "snapFallbackEnabled": true,
            "snapRadiiMeters": [500, 2000, 5000, 10000, 20000],
            "accessPointCacheHours": 720,
            "accessSearchRingKm": [1, 3, 7, 12, 20, 30, 40],
            "accessSearchBearings": 8,
            "accessCandidateSnapRadiusMeters": 2000,
            "accessWarningThresholdMeters": 100
        }'
        AS JSON
    )
)

ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value);