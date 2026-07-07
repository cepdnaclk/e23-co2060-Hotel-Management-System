USE tourismhub_lk;

-- Partner event upgrade.
-- Run this after database/schema.sql and database/tourist_events.sql.
-- It is safe to run more than one time.

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
  status ENUM('draft','published','hidden') DEFAULT 'published',
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
    ON DELETE SET NULL
);

DROP PROCEDURE IF EXISTS add_tourist_event_column;
DELIMITER $$
CREATE PROCEDURE add_tourist_event_column(
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

CALL add_tourist_event_column('partner_id', 'partner_id INT NULL', 'slug');
CALL add_tourist_event_column('property_id', 'property_id INT NULL', 'partner_id');
CALL add_tourist_event_column('event_date', 'event_date DATE NULL', 'month_number');
CALL add_tourist_event_column('contact_name', 'contact_name VARCHAR(150) NULL', 'map_url');
CALL add_tourist_event_column('contact_phone', 'contact_phone VARCHAR(30) NULL', 'contact_name');
CALL add_tourist_event_column('contact_email', 'contact_email VARCHAR(150) NULL', 'contact_phone');

DROP PROCEDURE add_tourist_event_column;

DROP PROCEDURE IF EXISTS add_tourist_event_fk;
DELIMITER $$
CREATE PROCEDURE add_tourist_event_fk(
  IN constraint_name_value VARCHAR(64),
  IN constraint_sql_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tourist_events'
      AND CONSTRAINT_NAME = constraint_name_value
  ) THEN
    SET @sql_text = constraint_sql_value;
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_tourist_event_fk(
  'fk_tourist_events_partner',
  'ALTER TABLE tourist_events ADD CONSTRAINT fk_tourist_events_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL'
);

CALL add_tourist_event_fk(
  'fk_tourist_events_property',
  'ALTER TABLE tourist_events ADD CONSTRAINT fk_tourist_events_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL'
);

DROP PROCEDURE add_tourist_event_fk;

DROP PROCEDURE IF EXISTS add_tourist_event_index;
DELIMITER $$
CREATE PROCEDURE add_tourist_event_index(
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

CALL add_tourist_event_index(
  'idx_tourist_events_partner',
  'CREATE INDEX idx_tourist_events_partner ON tourist_events(partner_id, status)'
);

CALL add_tourist_event_index(
  'idx_tourist_events_property',
  'CREATE INDEX idx_tourist_events_property ON tourist_events(property_id, status)'
);

CALL add_tourist_event_index(
  'idx_tourist_events_date',
  'CREATE INDEX idx_tourist_events_date ON tourist_events(event_date, status)'
);

DROP PROCEDURE add_tourist_event_index;
