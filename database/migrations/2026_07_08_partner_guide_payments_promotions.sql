USE tourismhub_lk;

-- Adds guide registration payment and promoted-listing support.
-- Safe to run more than once.
SET SQL_SAFE_UPDATES = 0;

DROP PROCEDURE IF EXISTS add_guide_column_if_missing;
DELIMITER $$
CREATE PROCEDURE add_guide_column_if_missing(
  IN column_name_value VARCHAR(64),
  IN column_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'partner_guides'
      AND COLUMN_NAME = column_name_value
  ) THEN
    SET @sql_text = CONCAT('ALTER TABLE partner_guides ADD COLUMN ', column_definition_value);
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_guide_column_if_missing('registration_fee', 'registration_fee DECIMAL(10,2) NOT NULL DEFAULT 3000.00');
CALL add_guide_column_if_missing('registration_payment_status', 'registration_payment_status ENUM(''Unpaid'',''Paid'') NOT NULL DEFAULT ''Unpaid''');
CALL add_guide_column_if_missing('registration_paid_at', 'registration_paid_at DATETIME NULL');
CALL add_guide_column_if_missing('promotion_fee', 'promotion_fee DECIMAL(10,2) NOT NULL DEFAULT 1500.00');
CALL add_guide_column_if_missing('promotion_payment_status', 'promotion_payment_status ENUM(''Unpaid'',''Paid'') NOT NULL DEFAULT ''Unpaid''');
CALL add_guide_column_if_missing('promotion_paid_at', 'promotion_paid_at DATETIME NULL');
CALL add_guide_column_if_missing('promotion_expires_at', 'promotion_expires_at DATETIME NULL');
CALL add_guide_column_if_missing('is_promoted', 'is_promoted BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_guide_column_if_missing('promotion_sort_order', 'promotion_sort_order INT NOT NULL DEFAULT 0');

DROP PROCEDURE add_guide_column_if_missing;

DROP PROCEDURE IF EXISTS add_guide_index_if_missing;
DELIMITER $$
CREATE PROCEDURE add_guide_index_if_missing(
  IN index_name_value VARCHAR(64),
  IN index_sql_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'partner_guides'
      AND INDEX_NAME = index_name_value
  ) THEN
    SET @sql_text = index_sql_value;
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_guide_index_if_missing('idx_partner_guides_payment_status', 'CREATE INDEX idx_partner_guides_payment_status ON partner_guides(registration_payment_status, promotion_payment_status)');
CALL add_guide_index_if_missing('idx_partner_guides_public_sort', 'CREATE INDEX idx_partner_guides_public_sort ON partner_guides(status, is_promoted, promotion_expires_at, promotion_sort_order, rating)');

DROP PROCEDURE add_guide_index_if_missing;

CREATE TABLE IF NOT EXISTS guide_payment_transactions (
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

DROP PROCEDURE IF EXISTS add_guide_payment_index_if_missing;
DELIMITER $$
CREATE PROCEDURE add_guide_payment_index_if_missing(
  IN index_name_value VARCHAR(64),
  IN index_sql_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_payment_transactions'
      AND INDEX_NAME = index_name_value
  ) THEN
    SET @sql_text = index_sql_value;
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_guide_payment_index_if_missing('idx_guide_payment_transactions_guide', 'CREATE INDEX idx_guide_payment_transactions_guide ON guide_payment_transactions(guide_id)');
CALL add_guide_payment_index_if_missing('idx_guide_payment_transactions_partner', 'CREATE INDEX idx_guide_payment_transactions_partner ON guide_payment_transactions(partner_id)');
CALL add_guide_payment_index_if_missing('idx_guide_payment_transactions_type', 'CREATE INDEX idx_guide_payment_transactions_type ON guide_payment_transactions(payment_type, status)');

DROP PROCEDURE add_guide_payment_index_if_missing;

-- Backfill old already-approved demo guides so they remain public.
UPDATE partner_guides
SET registration_payment_status = 'Paid',
    registration_paid_at = COALESCE(registration_paid_at, approved_at, NOW())
WHERE status = 'approved'
  AND registration_payment_status = 'Unpaid';

-- Expired promotions should not stay at the top.
UPDATE partner_guides
SET is_promoted = FALSE,
    promotion_payment_status = 'Unpaid',
    promotion_sort_order = 0
WHERE promotion_expires_at IS NOT NULL
  AND promotion_expires_at < NOW();

SELECT id, display_name, status, registration_payment_status, promotion_payment_status, is_promoted
FROM partner_guides
ORDER BY id DESC;

SET SQL_SAFE_UPDATES = 1;
