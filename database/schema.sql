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
  type ENUM('success', 'approval', 'rejection', 'booking', 'system') NOT NULL DEFAULT 'system',
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

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_partner ON properties(partner_id);
CREATE INDEX idx_properties_plan_type ON properties(plan_type);
CREATE INDEX idx_properties_public_visibility ON properties(status, registration_payment_status, monthly_payment_status, next_monthly_due_date);
CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_payment_transactions_property ON payment_transactions(property_id);
CREATE INDEX idx_payment_transactions_partner ON payment_transactions(partner_id);
