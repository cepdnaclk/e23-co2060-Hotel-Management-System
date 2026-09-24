-- Run against your EXISTING database. Safe to run more than once; no existing data is deleted.
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
