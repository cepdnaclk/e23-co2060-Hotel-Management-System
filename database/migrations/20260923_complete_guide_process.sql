USE tourismhub_lk;

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

CREATE INDEX idx_guide_bookings_guide_date ON guide_bookings(guide_id, booking_date, booking_status);
CREATE INDEX idx_guide_bookings_tourist ON guide_bookings(tourist_id, created_at);
CREATE INDEX idx_guide_booking_payments_booking ON guide_booking_payments(booking_id);
CREATE INDEX idx_guide_reviews_guide ON guide_reviews(guide_id, created_at);
