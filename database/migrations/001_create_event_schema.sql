CREATE DATABASE IF NOT EXISTS app_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE app_db;

CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role ENUM('super_admin','admin_event','finance','scanner') NOT NULL DEFAULT 'admin_event',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS speakers (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  nama_lengkap VARCHAR(255) NOT NULL,
  alamat TEXT NULL,
  keahlian JSON NOT NULL DEFAULT (JSON_ARRAY()),
  no_telp VARCHAR(20) NULL,
  portfolio_url VARCHAR(500) NULL,
  kategori ENUM('Tech','Bisnis','Desain','Jurnalistik','Keagamaan','Lainnya') NOT NULL DEFAULT 'Lainnya',
  foto_path VARCHAR(500) NULL,
  bio TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_speakers_kategori (kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bank_accounts (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  category ENUM('Pelatihan','Seremonial','Rapat') NOT NULL,
  event_type ENUM('Sistem Kelas','Non-Kelas') NOT NULL DEFAULT 'Non-Kelas',
  poster_path VARCHAR(500) NULL,
  description TEXT NULL,
  location_name VARCHAR(500) NULL,
  location_gmaps VARCHAR(500) NULL,
  start_date DATETIME NOT NULL,
  registration_deadline DATETIME NULL,
  is_open_for_public TINYINT(1) NOT NULL DEFAULT 1,
  is_paid TINYINT(1) NOT NULL DEFAULT 0,
  price_niam INT UNSIGNED NOT NULL DEFAULT 0,
  price_public INT UNSIGNED NOT NULL DEFAULT 0,
  max_participants INT UNSIGNED NULL,
  current_participants INT UNSIGNED NOT NULL DEFAULT 0,
  status_pendaftaran ENUM('open','closed','full') NOT NULL DEFAULT 'open',
  status ENUM('DRAFT','PENDING','APPROVED','LIVE','FINISHED','COMPLETED') NOT NULL DEFAULT 'DRAFT',
  payment_method ENUM('manual','gateway') NOT NULL DEFAULT 'manual',
  gateway_provider VARCHAR(50) NULL,
  gateway_config JSON NULL,
  bank_account_id CHAR(36) NULL,
  speaker_id CHAR(36) NULL,
  gdrive_lpj VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_speaker FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_events_status (status),
  INDEX idx_events_start_date (start_date),
  INDEX idx_events_registration_status (status_pendaftaran)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_speakers (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  speaker_id CHAR(36) NOT NULL,
  topik VARCHAR(500) NULL,
  kelas VARCHAR(100) NULL,
  urutan TINYINT NOT NULL DEFAULT 1,
  notif_sent_at DATETIME NULL,
  CONSTRAINT fk_event_speakers_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_speakers_speaker FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_event_speakers_event_speaker (event_id, speaker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_guests (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255) NULL,
  whatsapp VARCHAR(20) NOT NULL,
  id_card_path VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_guests_whatsapp (whatsapp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crew_members (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  niam VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  unit VARCHAR(255) NULL,
  photo_path VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_participants (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  crew_id CHAR(36) NULL,
  guest_id CHAR(36) NULL,
  registration_path ENUM('NIAM','UMUM') NOT NULL,
  payment_status ENUM('Free','Unpaid','Pending_Approval','Paid') NOT NULL DEFAULT 'Unpaid',
  unique_amount INT UNSIGNED NOT NULL DEFAULT 0,
  payment_proof_path VARCHAR(500) NULL,
  attendance_status ENUM('Registered','Attended','Cancelled') NOT NULL DEFAULT 'Registered',
  qr_token VARCHAR(100) NOT NULL UNIQUE,
  attended_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_participants_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_participants_crew FOREIGN KEY (crew_id) REFERENCES crew_members(id) ON DELETE SET NULL,
  CONSTRAINT fk_event_participants_guest FOREIGN KEY (guest_id) REFERENCES event_guests(id) ON DELETE SET NULL,
  CONSTRAINT chk_event_participants_identity CHECK (
    (registration_path = 'NIAM' AND crew_id IS NOT NULL AND guest_id IS NULL)
    OR (registration_path = 'UMUM' AND guest_id IS NOT NULL AND crew_id IS NULL)
  ),
  UNIQUE KEY uq_event_participants_event_crew (event_id, crew_id),
  UNIQUE KEY uq_event_participants_event_guest (event_id, guest_id),
  INDEX idx_event_participants_event (event_id),
  INDEX idx_event_participants_qr (qr_token),
  INDEX idx_event_participants_payment (payment_status),
  INDEX idx_event_participants_attendance (attendance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  participant_id CHAR(36) NOT NULL,
  amount INT UNSIGNED NOT NULL,
  status ENUM('Unpaid','Pending_Approval','Paid','Rejected') NOT NULL DEFAULT 'Unpaid',
  proof_path VARCHAR(500) NULL,
  submitted_at DATETIME NULL,
  verified_by CHAR(36) NULL,
  verified_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_participant FOREIGN KEY (participant_id) REFERENCES event_participants(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_verified_by FOREIGN KEY (verified_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_custom_fields (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type ENUM('short_text','long_text','radio','dropdown','checkbox') NOT NULL,
  options JSON NOT NULL DEFAULT (JSON_ARRAY()),
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  order_num INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_custom_fields_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_custom_fields_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS participant_responses (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  participant_id CHAR(36) NOT NULL,
  field_id CHAR(36) NOT NULL,
  response_value JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participant_responses_participant FOREIGN KEY (participant_id) REFERENCES event_participants(id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_responses_field FOREIGN KEY (field_id) REFERENCES event_custom_fields(id) ON DELETE CASCADE,
  UNIQUE KEY uq_participant_responses_participant_field (participant_id, field_id),
  INDEX idx_participant_responses_participant (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_checkins (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  participant_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  scanned_by CHAR(36) NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scan_result ENUM('success','already_attended','invalid_ticket','unpaid','wrong_event') NOT NULL,
  device_label VARCHAR(255) NULL,
  notes TEXT NULL,
  CONSTRAINT fk_qr_checkins_participant FOREIGN KEY (participant_id) REFERENCES event_participants(id) ON DELETE CASCADE,
  CONSTRAINT fk_qr_checkins_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_qr_checkins_scanned_by FOREIGN KEY (scanned_by) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_qr_checkins_event (event_id),
  INDEX idx_qr_checkins_participant (participant_id),
  INDEX idx_qr_checkins_result (scan_result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  actor_id CHAR(36) NULL,
  actor_role VARCHAR(50) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36) NULL,
  metadata JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_event_participants_after_insert;
DROP TRIGGER IF EXISTS trg_event_participants_after_update;

DELIMITER $$

CREATE TRIGGER trg_event_participants_after_insert
AFTER INSERT ON event_participants
FOR EACH ROW
BEGIN
  UPDATE events
  SET
    current_participants = (
      SELECT COUNT(*) FROM event_participants
      WHERE event_id = NEW.event_id
        AND attendance_status != 'Cancelled'
    ),
    status_pendaftaran = CASE
      WHEN max_participants IS NULL THEN status_pendaftaran
      WHEN (
        SELECT COUNT(*) FROM event_participants
        WHERE event_id = NEW.event_id
          AND attendance_status != 'Cancelled'
      ) >= max_participants THEN 'full'
      ELSE 'open'
    END
  WHERE id = NEW.event_id;
END$$

CREATE TRIGGER trg_event_participants_after_update
AFTER UPDATE ON event_participants
FOR EACH ROW
BEGIN
  UPDATE events
  SET
    current_participants = (
      SELECT COUNT(*) FROM event_participants
      WHERE event_id = NEW.event_id
        AND attendance_status != 'Cancelled'
    ),
    status_pendaftaran = CASE
      WHEN max_participants IS NULL THEN status_pendaftaran
      WHEN (
        SELECT COUNT(*) FROM event_participants
        WHERE event_id = NEW.event_id
          AND attendance_status != 'Cancelled'
      ) >= max_participants THEN 'full'
      ELSE 'open'
    END
  WHERE id = NEW.event_id;
END$$

DELIMITER ;
