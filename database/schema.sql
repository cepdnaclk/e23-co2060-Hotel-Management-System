DROP DATABASE IF EXISTS tourismhub_lk;
CREATE DATABASE tourismhub_lk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tourismhub_lk;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  nationality VARCHAR(100),
  national_id VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('tourist', 'partner', 'admin') NOT NULL DEFAULT 'tourist',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ADMIN CONTROLLED PROPERTY PAYMENT VERSIONS
-- =========================================================
CREATE TABLE property_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_key VARCHAR(60) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  room_limit INT NOT NULL DEFAULT 50,
  registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- ADMIN CONTROLLED PAYMENT METHODS
-- Kept because existing payment fields reference this table.
-- =========================================================
CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  method_name VARCHAR(100) NOT NULL,
  method_type ENUM('bank_transfer', 'card', 'cash', 'online', 'other') NOT NULL DEFAULT 'bank_transfer',
  account_details TEXT NULL,
  instructions TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- PROPERTIES
-- Rules:
-- - plan_type comes from property_plans.plan_key.
-- - First month after registration is Free Trial.
-- - After monthly due date, property hides from public pages until monthly fee is paid.
-- - Changing version starts a new monthly cycle from that day and monthly payment becomes Unpaid.
-- =========================================================
CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,

  name VARCHAR(180) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  address TEXT,
  description TEXT,

  quote TEXT,
  logo_url TEXT,
  hero_title VARCHAR(180),
  theme_color VARCHAR(30) DEFAULT '#0f7a43',
  property_password_hash VARCHAR(255) NOT NULL,

  property_type ENUM('Hotel', 'Resort', 'Villa', 'Guesthouse') DEFAULT 'Hotel',

  plan_type VARCHAR(60) NOT NULL DEFAULT 'standard',
  room_limit INT NOT NULL DEFAULT 50,

  registration_fee DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  registration_payment_status ENUM('Unpaid', 'Paid') NOT NULL DEFAULT 'Unpaid',
  registration_payment_method_id INT NULL,
  registration_paid_at DATETIME NULL,

  monthly_charge DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  monthly_payment_status ENUM('Free Trial', 'Unpaid', 'Paid') NOT NULL DEFAULT 'Free Trial',
  monthly_payment_method_id INT NULL,
  monthly_paid_at DATETIME NULL,
  monthly_cycle_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monthly_cycle_end DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  next_monthly_due_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Old names kept so older pages/controllers do not immediately break.
  platform_registration_fee DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  fee_payment_status ENUM('Unpaid', 'Paid') NOT NULL DEFAULT 'Unpaid',

  status ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_properties_partner
    FOREIGN KEY (partner_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_properties_reg_method
    FOREIGN KEY (registration_payment_method_id) REFERENCES payment_methods(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_properties_monthly_method
    FOREIGN KEY (monthly_payment_method_id) REFERENCES payment_methods(id)
    ON DELETE SET NULL
);

-- =========================================================
-- ROOMS
-- =========================================================
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,

  room_type VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  base_occupancy INT NOT NULL DEFAULT 1,

  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  extra_person_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_per_day DECIMAL(10,2),

  total_rooms INT NOT NULL DEFAULT 1,
  available_rooms INT NOT NULL DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_rooms_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
);

CREATE TABLE property_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  image_url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_property_photos_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
);

CREATE TABLE room_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  image_url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_room_photos_room
    FOREIGN KEY (room_id) REFERENCES rooms(id)
    ON DELETE CASCADE
);

CREATE TABLE property_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  check_in_time TIME DEFAULT '14:00:00',
  check_out_time TIME DEFAULT '11:00:00',
  cancellation_policy TEXT,
  day_package_available BOOLEAN NOT NULL DEFAULT TRUE,
  night_package_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_property_policies_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(50) NOT NULL UNIQUE,
  tourist_id INT NULL,
  user_id INT NULL,
  guest_session_id VARCHAR(100) NULL,
  property_id INT NOT NULL,
  room_id INT NOT NULL,
  full_name VARCHAR(150) NULL,
  email VARCHAR(150) NULL,
  nationality VARCHAR(100) NULL,
  country_code VARCHAR(10) NULL,
  phone VARCHAR(30) NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  check_in_package ENUM('day', 'night', 'both') NOT NULL DEFAULT 'night',
  check_out_package ENUM('day', 'night', 'both') NOT NULL DEFAULT 'day',
  guests INT NOT NULL DEFAULT 1,
  nights INT NOT NULL DEFAULT 1,
  day_units INT NOT NULL DEFAULT 0,
  night_units INT NOT NULL DEFAULT 1,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  partner_note TEXT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending Payment',
  booking_status VARCHAR(80) NOT NULL DEFAULT 'Pending Partner Approval',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_tourist FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('success', 'approval', 'rejection', 'booking', 'property', 'event', 'system') NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  partner_id INT NOT NULL,
  payment_type ENUM('registration', 'monthly') NOT NULL,
  plan_type VARCHAR(60) NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Paid',
  paid_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_transactions_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payment_transactions_partner
    FOREIGN KEY (partner_id) REFERENCES users(id)
    ON DELETE CASCADE
);



-- =========================================================
-- EXPLORE MODULE
-- Admin can add/edit places. Public Explore page reads from these tables.
-- JSON fields keep the admin form simple and avoid too many small tables.
-- =========================================================
CREATE TABLE explore_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  icon VARCHAR(20),
  color VARCHAR(30),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE explore_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE explore_places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  region VARCHAR(100),
  category_id INT NULL,
  image_url TEXT NULL,
  short_description TEXT,
  full_description LONGTEXT,
  duration VARCHAR(100),
  best_time VARCHAR(150),
  best_months JSON,
  budget ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  budget_score INT NOT NULL DEFAULT 2,
  estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  lat DECIMAL(10,6) NULL,
  lng DECIMAL(10,6) NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  vibe VARCHAR(80),
  tags JSON,
  experiences JSON,
  highlights JSON,
  nearby_places JSON,
  tips JSON,
  opening_hours VARCHAR(180),
  entry_fee VARCHAR(180),
  facilities JSON,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_explore_places_category
    FOREIGN KEY (category_id) REFERENCES explore_categories(id)
    ON DELETE SET NULL
);

CREATE TABLE explore_place_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id INT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(180),
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_explore_images_place
    FOREIGN KEY (place_id) REFERENCES explore_places(id)
    ON DELETE CASCADE
);

CREATE TABLE explore_itineraries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  days VARCHAR(80),
  tone TEXT,
  link_city VARCHAR(100),
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE explore_itinerary_places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itinerary_id INT NOT NULL,
  place_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_explore_itinerary_places_itinerary
    FOREIGN KEY (itinerary_id) REFERENCES explore_itineraries(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_explore_itinerary_places_place
    FOREIGN KEY (place_id) REFERENCES explore_places(id)
    ON DELETE CASCADE
);

-- =========================================================
-- TOURIST EVENTS MODULE
-- Merged from tourist_events.sql and event approval migrations.
-- Final flow: partner creates pending event, admin approves/rejects it.
-- =========================================================
CREATE TABLE tourist_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  partner_id INT NULL,
  property_id INT NULL,
  explore_place_id INT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NULL,
  venue VARCHAR(180) NULL,
  month_name VARCHAR(40) NULL,
  month_number INT DEFAULT 1,
  event_date DATE NULL,
  date_label VARCHAR(100) NULL,
  time_label VARCHAR(100) NULL,
  price_type ENUM('Free','Budget','Paid','Premium') DEFAULT 'Budget',
  price DECIMAL(10,2) DEFAULT 0.00,
  duration VARCHAR(100) NULL,
  short_description TEXT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  map_url TEXT NULL,
  contact_name VARCHAR(150) NULL,
  contact_phone VARCHAR(30) NULL,
  contact_email VARCHAR(150) NULL,
  near_hotels JSON NULL,
  highlights JSON NULL,
  guide_recommended BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  status ENUM('pending','approved','rejected','hidden') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_tourist_events_partner
    FOREIGN KEY (partner_id) REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_tourist_events_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_tourist_events_place
    FOREIGN KEY (explore_place_id) REFERENCES explore_places(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_tourist_events_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON DELETE SET NULL
);

-- =========================================================
-- PARTNER GUIDES MODULE
-- Merged from partner guide and guide payment/promotion migrations.
-- =========================================================
CREATE TABLE partner_guides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  guide_type VARCHAR(80) NOT NULL DEFAULT 'Heritage',
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NULL,
  base_location VARCHAR(180) NULL,
  languages JSON NULL,
  experience_years INT NOT NULL DEFAULT 0,
  license_number VARCHAR(120) NULL,
  nic_or_passport VARCHAR(120) NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150) NOT NULL,
  whatsapp_number VARCHAR(40) NULL,
  price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  availability VARCHAR(180) NULL,
  services JSON NULL,
  specialities JSON NULL,
  short_description VARCHAR(255) NULL,
  bio TEXT NULL,
  image_url TEXT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 4.80,
  total_reviews INT NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected','hidden') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  submitted_at DATETIME NULL,
  approved_at DATETIME NULL,
  approved_by INT NULL,
  registration_fee DECIMAL(10,2) NOT NULL DEFAULT 3000.00,
  registration_payment_status ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
  registration_paid_at DATETIME NULL,
  promotion_fee DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
  promotion_payment_status ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
  promotion_paid_at DATETIME NULL,
  promotion_expires_at DATETIME NULL,
  is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
  promotion_sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_partner_guides_partner
    FOREIGN KEY (partner_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_partner_guides_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE guide_payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id INT NOT NULL,
  partner_id INT NOT NULL,
  payment_type ENUM('registration','promotion') NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pending','Paid') NOT NULL DEFAULT 'Paid',
  paid_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_guide_payment_transactions_guide
    FOREIGN KEY (guide_id) REFERENCES partner_guides(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_guide_payment_transactions_partner
    FOREIGN KEY (partner_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guide_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(50) NOT NULL UNIQUE,
  guide_id INT NOT NULL,
  tourist_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NULL,
  duration_type ENUM('hourly','full_day') NOT NULL DEFAULT 'full_day',
  hours INT NULL,
  guests INT NOT NULL DEFAULT 1,
  tour_type VARCHAR(120) NULL,
  pickup_location VARCHAR(255) NULL,
  message TEXT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  booking_status ENUM('pending','approved','rejected','cancelled','confirmed','completed') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  partner_note TEXT NULL,
  approved_at DATETIME NULL,
  rejected_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_guide_bookings_guide FOREIGN KEY (guide_id) REFERENCES partner_guides(id) ON DELETE CASCADE,
  CONSTRAINT fk_guide_bookings_tourist FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guide_booking_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  tourist_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  gateway VARCHAR(60) NULL,
  card_last4 VARCHAR(4) NULL,
  status ENUM('Pending','Paid','Refunded') NOT NULL DEFAULT 'Paid',
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_guide_booking_payments_booking FOREIGN KEY (booking_id) REFERENCES guide_bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_guide_booking_payments_tourist FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guide_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id INT NOT NULL,
  booking_id INT NOT NULL UNIQUE,
  tourist_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_guide_reviews_guide FOREIGN KEY (guide_id) REFERENCES partner_guides(id) ON DELETE CASCADE,
  CONSTRAINT fk_guide_reviews_booking FOREIGN KEY (booking_id) REFERENCES guide_bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_guide_reviews_tourist FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_guide_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

-- =========================================================
-- HOME PAGE CONTENT CONFIGURATION
-- =========================================================
CREATE TABLE IF NOT EXISTS home_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,

    section_key VARCHAR(80) NOT NULL UNIQUE,

    eyebrow VARCHAR(120) NULL,
    title VARCHAR(220) NOT NULL,
    description TEXT NULL,

    primary_button_label VARCHAR(100) NULL,
    primary_button_url VARCHAR(255) NULL,

    secondary_button_label VARCHAR(100) NULL,
    secondary_button_url VARCHAR(255) NULL,

    media_type ENUM('none', 'image', 'video')
        NOT NULL DEFAULT 'none',

    media_path TEXT NULL,
    poster_path TEXT NULL,
    alt_text VARCHAR(220) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_home_sections_active_sort (
        is_active,
        sort_order
    )
);


CREATE TABLE IF NOT EXISTS home_quick_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    action_key VARCHAR(80) NOT NULL UNIQUE,

    label VARCHAR(120) NULL,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(320) NULL,

    button_label VARCHAR(100) NOT NULL,
    target_url VARCHAR(255) NOT NULL,

    icon VARCHAR(30) NULL,

    media_path TEXT NULL,
    alt_text VARCHAR(220) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_home_quick_actions_active_sort (
        is_active,
        sort_order
    )
);


-- =========================================================
-- TRIP PLANNER
-- Saved plans, day items, route cache and routing access cache.
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


CREATE INDEX idx_guide_bookings_guide_date ON guide_bookings(guide_id, booking_date, booking_status);
CREATE INDEX idx_guide_bookings_tourist ON guide_bookings(tourist_id, created_at);
CREATE INDEX idx_guide_booking_payments_booking ON guide_booking_payments(booking_id);
CREATE INDEX idx_guide_reviews_guide ON guide_reviews(guide_id, created_at);


CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_partner ON properties(partner_id);
CREATE INDEX idx_properties_plan_type ON properties(plan_type);
CREATE INDEX idx_properties_public_visibility ON properties(status, registration_payment_status, monthly_payment_status, next_monthly_due_date);
CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_payment_transactions_property ON payment_transactions(property_id);
CREATE INDEX idx_payment_transactions_partner ON payment_transactions(partner_id);
CREATE INDEX idx_explore_categories_slug ON explore_categories(slug);
CREATE INDEX idx_explore_places_status ON explore_places(status);
CREATE INDEX idx_explore_places_region ON explore_places(region);
CREATE INDEX idx_explore_places_budget ON explore_places(budget);
CREATE INDEX idx_explore_places_featured ON explore_places(featured);
CREATE INDEX idx_explore_places_category ON explore_places(category_id);
CREATE INDEX idx_explore_images_place ON explore_place_images(place_id);
CREATE INDEX idx_explore_itinerary_places_itinerary ON explore_itinerary_places(itinerary_id);
CREATE INDEX idx_explore_itinerary_places_place ON explore_itinerary_places(place_id);

CREATE UNIQUE INDEX uq_tourist_events_slug ON tourist_events(slug);
CREATE INDEX idx_tourist_events_status ON tourist_events(status);
CREATE INDEX idx_tourist_events_admin_status ON tourist_events(status, submitted_at);
CREATE INDEX idx_tourist_events_partner_status ON tourist_events(partner_id, status);
CREATE INDEX idx_tourist_events_property_status ON tourist_events(property_id, status);
CREATE INDEX idx_tourist_events_filters ON tourist_events(status, category, city, month_name, price_type);
CREATE INDEX idx_tourist_events_place ON tourist_events(explore_place_id, status);
CREATE INDEX idx_tourist_events_date ON tourist_events(event_date, status);
CREATE INDEX idx_partner_guides_partner ON partner_guides(partner_id);
CREATE INDEX idx_partner_guides_status ON partner_guides(status);
CREATE INDEX idx_partner_guides_city ON partner_guides(city);
CREATE INDEX idx_partner_guides_type ON partner_guides(guide_type);
CREATE INDEX idx_partner_guides_payment_status ON partner_guides(registration_payment_status, promotion_payment_status);
CREATE INDEX idx_partner_guides_public_sort ON partner_guides(status, is_promoted, promotion_expires_at, promotion_sort_order, rating);
CREATE INDEX idx_guide_payment_transactions_guide ON guide_payment_transactions(guide_id);
CREATE INDEX idx_guide_payment_transactions_partner ON guide_payment_transactions(partner_id);
CREATE INDEX idx_guide_payment_transactions_type ON guide_payment_transactions(payment_type, status);


-- EVENT REPORTS AND MODERATION
CREATE TABLE IF NOT EXISTS event_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NULL,
  event_title VARCHAR(180) NOT NULL,
  reporter_id INT NOT NULL,
  reason ENUM('incorrect_information','cancelled_event','misleading_price','inappropriate_content','other') NOT NULL,
  details TEXT NOT NULL,
  status ENUM('submitted','under_review','resolved','dismissed') NOT NULL DEFAULT 'submitted',
  admin_response TEXT NULL,
  reviewed_by INT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_event_reports_owner (reporter_id, created_at),
  INDEX idx_event_reports_queue (status, created_at),
  INDEX idx_event_reports_event (event_id, reporter_id, status),
  CONSTRAINT fk_event_reports_event FOREIGN KEY (event_id) REFERENCES tourist_events(id) ON DELETE SET NULL,
  CONSTRAINT fk_event_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_report_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  actor_id INT NULL,
  status ENUM('submitted','under_review','resolved','dismissed') NOT NULL,
  response TEXT NULL,
  visibility_action ENUM('unchanged','hide','restore') NOT NULL DEFAULT 'unchanged',
  moderation_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_history (report_id, id),
  CONSTRAINT fk_report_history_report FOREIGN KEY (report_id) REFERENCES event_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_history_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Separate from partner-controlled status so edits/resubmission cannot remove a moderation hold.
CREATE TABLE IF NOT EXISTS event_moderation (
  event_id INT PRIMARY KEY,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT NOT NULL,
  moderated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_moderation_event FOREIGN KEY (event_id) REFERENCES tourist_events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_moderation_admin FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
