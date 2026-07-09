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

