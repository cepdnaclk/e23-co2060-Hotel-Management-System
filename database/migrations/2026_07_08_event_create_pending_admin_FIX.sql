USE tourismhub_lk;

-- Final fix for Partner Event Create -> Pending -> Admin Approval flow.
-- This file is safe to run more than once.
-- It does NOT require the explore_places table.

SET SQL_SAFE_UPDATES = 0;

CREATE TABLE IF NOT EXISTS tourist_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NULL,
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
  status ENUM('pending','approved','rejected','draft','published','hidden') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP PROCEDURE IF EXISTS add_event_column_if_missing;
DELIMITER $$
CREATE PROCEDURE add_event_column_if_missing(
  IN column_name_value VARCHAR(64),
  IN column_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tourist_events'
      AND COLUMN_NAME = column_name_value
  ) THEN
    SET @sql_text = CONCAT('ALTER TABLE tourist_events ADD COLUMN ', column_definition_value);
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_event_column_if_missing('slug', 'slug VARCHAR(160) NULL');
CALL add_event_column_if_missing('partner_id', 'partner_id INT NULL');
CALL add_event_column_if_missing('property_id', 'property_id INT NULL');
CALL add_event_column_if_missing('explore_place_id', 'explore_place_id INT NULL');
CALL add_event_column_if_missing('title', 'title VARCHAR(180) NULL');
CALL add_event_column_if_missing('category', 'category VARCHAR(80) NULL');
CALL add_event_column_if_missing('city', 'city VARCHAR(100) NULL');
CALL add_event_column_if_missing('district', 'district VARCHAR(100) NULL');
CALL add_event_column_if_missing('venue', 'venue VARCHAR(180) NULL');
CALL add_event_column_if_missing('month_name', 'month_name VARCHAR(40) NULL');
CALL add_event_column_if_missing('month_number', 'month_number INT DEFAULT 1');
CALL add_event_column_if_missing('event_date', 'event_date DATE NULL');
CALL add_event_column_if_missing('date_label', 'date_label VARCHAR(100) NULL');
CALL add_event_column_if_missing('time_label', 'time_label VARCHAR(100) NULL');
CALL add_event_column_if_missing('price_type', 'price_type ENUM(''Free'',''Budget'',''Paid'',''Premium'') DEFAULT ''Budget''');
CALL add_event_column_if_missing('price', 'price DECIMAL(10,2) DEFAULT 0.00');
CALL add_event_column_if_missing('duration', 'duration VARCHAR(100) NULL');
CALL add_event_column_if_missing('short_description', 'short_description TEXT NULL');
CALL add_event_column_if_missing('description', 'description TEXT NULL');
CALL add_event_column_if_missing('image_url', 'image_url TEXT NULL');
CALL add_event_column_if_missing('map_url', 'map_url TEXT NULL');
CALL add_event_column_if_missing('contact_name', 'contact_name VARCHAR(150) NULL');
CALL add_event_column_if_missing('contact_phone', 'contact_phone VARCHAR(30) NULL');
CALL add_event_column_if_missing('contact_email', 'contact_email VARCHAR(150) NULL');
CALL add_event_column_if_missing('near_hotels', 'near_hotels JSON NULL');
CALL add_event_column_if_missing('highlights', 'highlights JSON NULL');
CALL add_event_column_if_missing('guide_recommended', 'guide_recommended BOOLEAN DEFAULT FALSE');
CALL add_event_column_if_missing('featured', 'featured BOOLEAN DEFAULT FALSE');
CALL add_event_column_if_missing('status', 'status ENUM(''pending'',''approved'',''rejected'',''draft'',''published'',''hidden'') NOT NULL DEFAULT ''pending''');
CALL add_event_column_if_missing('rejection_reason', 'rejection_reason TEXT NULL');
CALL add_event_column_if_missing('submitted_at', 'submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_event_column_if_missing('approved_at', 'approved_at TIMESTAMP NULL');
CALL add_event_column_if_missing('approved_by', 'approved_by INT NULL');
CALL add_event_column_if_missing('created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL add_event_column_if_missing('updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

DROP PROCEDURE add_event_column_if_missing;

-- Allow old and new statuses during conversion.
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

UPDATE tourist_events
SET slug = CONCAT('event-', id)
WHERE slug IS NULL OR slug = '';

-- Final status list for admin approval flow.
ALTER TABLE tourist_events
  MODIFY status ENUM('pending','approved','rejected','hidden') NOT NULL DEFAULT 'pending';

DROP PROCEDURE IF EXISTS add_event_index_if_missing;
DELIMITER $$
CREATE PROCEDURE add_event_index_if_missing(
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

CALL add_event_index_if_missing('uq_tourist_events_slug', 'CREATE UNIQUE INDEX uq_tourist_events_slug ON tourist_events(slug)');
CALL add_event_index_if_missing('idx_tourist_events_admin_status', 'CREATE INDEX idx_tourist_events_admin_status ON tourist_events(status, submitted_at)');
CALL add_event_index_if_missing('idx_tourist_events_partner_status', 'CREATE INDEX idx_tourist_events_partner_status ON tourist_events(partner_id, status)');
CALL add_event_index_if_missing('idx_tourist_events_property_status', 'CREATE INDEX idx_tourist_events_property_status ON tourist_events(property_id, status)');

DROP PROCEDURE add_event_index_if_missing;

-- Make notifications compatible only if the table already exists.
DROP PROCEDURE IF EXISTS fix_notifications_event_types;
DELIMITER $$
CREATE PROCEDURE fix_notifications_event_types()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notifications'
  ) THEN
    ALTER TABLE notifications
      MODIFY type ENUM('success','approval','rejection','booking','property','event','system') NOT NULL DEFAULT 'system';
  END IF;
END$$
DELIMITER ;

CALL fix_notifications_event_types();
DROP PROCEDURE fix_notifications_event_types;

SET SQL_SAFE_UPDATES = 1;

-- Quick check after running:
SELECT status, COUNT(*) AS event_count
FROM tourist_events
GROUP BY status;
