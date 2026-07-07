USE tourismhub_lk;

-- Makes the public tourist pages show only admin-approved items.
-- Safe to run more than once.
SET SQL_SAFE_UPDATES = 0;

-- Old event table versions may still have only draft/published/hidden.
-- This makes pending/approved/rejected valid for the admin approval flow.
ALTER TABLE tourist_events
  MODIFY status ENUM('pending','approved','rejected','draft','published','hidden') NOT NULL DEFAULT 'pending';

-- Old published demo/seed events should be treated as approved public events.
UPDATE tourist_events
SET status = 'approved',
    submitted_at = COALESCE(submitted_at, created_at, NOW()),
    approved_at = COALESCE(approved_at, NOW())
WHERE status = 'published';

-- Any event approved by admin must be visible on the public Events page.
UPDATE tourist_events
SET submitted_at = COALESCE(submitted_at, created_at, NOW()),
    approved_at = COALESCE(approved_at, NOW())
WHERE status = 'approved';

-- Any property approved by admin must be visible on the public Hotels page.
-- Payment fields are also cleaned so older backend code will not hide approved hotels.
UPDATE properties
SET is_verified = TRUE,
    registration_payment_status = 'Paid',
    fee_payment_status = 'Paid',
    registration_paid_at = COALESCE(registration_paid_at, NOW()),
    monthly_payment_status = COALESCE(monthly_payment_status, 'Free Trial'),
    monthly_cycle_start = COALESCE(monthly_cycle_start, NOW()),
    monthly_cycle_end = CASE
      WHEN monthly_cycle_end IS NULL OR monthly_cycle_end <= NOW()
      THEN DATE_ADD(NOW(), INTERVAL 1 MONTH)
      ELSE monthly_cycle_end
    END,
    next_monthly_due_date = CASE
      WHEN next_monthly_due_date IS NULL OR next_monthly_due_date <= NOW()
      THEN DATE_ADD(NOW(), INTERVAL 1 MONTH)
      ELSE next_monthly_due_date
    END
WHERE status = 'approved';

SET SQL_SAFE_UPDATES = 1;

-- Quick checks after running:
SELECT id, name, city, status, is_verified
FROM properties
WHERE status = 'approved'
ORDER BY id DESC;

SELECT id, title, city, status, approved_at
FROM tourist_events
WHERE status = 'approved'
ORDER BY id DESC;
