USE tourismhub_lk;

-- Partner Event Admin Approval Migration
-- Run this after schema.sql and the previous partner event migration.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS tourist_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  partner_id INT NULL,
  property_id INT NULL,
  explore_place_id INT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  venue VARCHAR(180),
  month_name VARCHAR(40),
  month_number INT DEFAULT 1,
  event_date DATE NULL,
  date_label VARCHAR(100),
  time_label VARCHAR(100),
  price_type ENUM('Free','Budget','Paid','Premium') DEFAULT 'Budget',
  price DECIMAL(10,2) DEFAULT 0.00,
  duration VARCHAR(100),
  short_description TEXT,
  description TEXT,
  image_url TEXT,
  map_url TEXT,
  contact_name VARCHAR(150) NULL,
  contact_phone VARCHAR(30) NULL,
  contact_email VARCHAR(150) NULL,
  near_hotels JSON,
  highlights JSON,
  guide_recommended BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  status ENUM('pending','approved','rejected','draft','hidden') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP PROCEDURE IF EXISTS add_tourist_event_approval_column;
DELIMITER $$
CREATE PROCEDURE add_tourist_event_approval_column(
  IN column_name_value VARCHAR(64),
  IN column_definition_value TEXT,
  IN after_column_value VARCHAR(64)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tourist_events'
      AND COLUMN_NAME = column_name_value
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE tourist_events ADD COLUMN ',
      column_definition_value,
      ' AFTER ',
      after_column_value
    );
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_tourist_event_approval_column('partner_id', 'partner_id INT NULL', 'slug');
CALL add_tourist_event_approval_column('property_id', 'property_id INT NULL', 'partner_id');
CALL add_tourist_event_approval_column('event_date', 'event_date DATE NULL', 'month_number');
CALL add_tourist_event_approval_column('contact_name', 'contact_name VARCHAR(150) NULL', 'map_url');
CALL add_tourist_event_approval_column('contact_phone', 'contact_phone VARCHAR(30) NULL', 'contact_name');
CALL add_tourist_event_approval_column('contact_email', 'contact_email VARCHAR(150) NULL', 'contact_phone');
CALL add_tourist_event_approval_column('rejection_reason', 'rejection_reason TEXT NULL', 'status');
CALL add_tourist_event_approval_column('submitted_at', 'submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP', 'rejection_reason');
CALL add_tourist_event_approval_column('approved_at', 'approved_at TIMESTAMP NULL', 'submitted_at');
CALL add_tourist_event_approval_column('approved_by', 'approved_by INT NULL', 'approved_at');

DROP PROCEDURE add_tourist_event_approval_column;

-- Convert old event status flow to admin approval flow.
-- Old published events become approved. New partner submissions become pending.
ALTER TABLE tourist_events
  MODIFY status ENUM('pending','approved','rejected','draft','published','hidden') NOT NULL DEFAULT 'pending';

UPDATE tourist_events
SET status = 'approved'
WHERE status = 'published';

UPDATE tourist_events
SET status = 'pending'
WHERE status = 'draft';

UPDATE tourist_events
SET submitted_at = COALESCE(submitted_at, created_at, NOW())
WHERE submitted_at IS NULL;

ALTER TABLE tourist_events
  MODIFY status ENUM('pending','approved','rejected','draft','hidden') NOT NULL DEFAULT 'pending';

DROP PROCEDURE IF EXISTS add_event_approval_index;
DELIMITER $$
CREATE PROCEDURE add_event_approval_index(
  IN index_name_value VARCHAR(64),
  IN index_sql_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tourist_events'
      AND INDEX_NAME = index_name_value
  ) THEN
    SET @sql_text = index_sql_value;
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_event_approval_index(
  'idx_tourist_events_admin_status',
  'CREATE INDEX idx_tourist_events_admin_status ON tourist_events(status, submitted_at)'
);

CALL add_event_approval_index(
  'idx_tourist_events_partner_status',
  'CREATE INDEX idx_tourist_events_partner_status ON tourist_events(partner_id, status)'
);

CALL add_event_approval_index(
  'idx_tourist_events_property_status',
  'CREATE INDEX idx_tourist_events_property_status ON tourist_events(property_id, status)'
);

DROP PROCEDURE add_event_approval_index;

-- Keep notifications safe for property and event approval/rejection messages.
ALTER TABLE notifications
  MODIFY type ENUM('success','approval','rejection','booking','property','event','system') NOT NULL DEFAULT 'system';
