USE tourismhub_lk;

CREATE TABLE IF NOT EXISTS partner_guides (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_partner_guides_partner
    FOREIGN KEY (partner_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_partner_guides_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_partner_guides_partner ON partner_guides(partner_id);
CREATE INDEX idx_partner_guides_status ON partner_guides(status);
CREATE INDEX idx_partner_guides_city ON partner_guides(city);
CREATE INDEX idx_partner_guides_type ON partner_guides(guide_type);
