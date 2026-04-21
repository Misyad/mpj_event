-- ============================================================
-- MPJ EVENT — SKEMA DATABASE MySQL
-- Backend: Laravel (Custom) | Versi: 2026.1
-- ============================================================

-- ─── TABEL SPEAKERS ─────────────────────────────────────────
CREATE TABLE speakers (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  nama_lengkap  VARCHAR(255)  NOT NULL,
  alamat        TEXT          NULL,
  keahlian      JSON          NOT NULL DEFAULT ('[]'),
  -- Format: ["UI/UX Design", "Figma", "Design Thinking"]
  no_telp       VARCHAR(20)   NULL,
  portfolio_url VARCHAR(500)  NULL,
  kategori      ENUM('Tech','Bisnis','Desain','Jurnalistik','Keagamaan','Lainnya')
                              NOT NULL DEFAULT 'Lainnya',
  foto_path     VARCHAR(500)  NULL,
  -- Menyimpan file path (bukan URL eksternal)
  bio           TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kategori (kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL BANK ACCOUNTS ────────────────────────────────────
CREATE TABLE bank_accounts (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  bank_name      VARCHAR(100) NOT NULL,
  account_number VARCHAR(50)  NOT NULL,
  account_name   VARCHAR(200) NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL EVENTS ───────────────────────────────────────────
CREATE TABLE events (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  title               VARCHAR(500) NOT NULL,
  category            ENUM('Pelatihan','Seremonial','Rapat') NOT NULL,
  event_type          ENUM('Sistem Kelas','Non-Kelas') NOT NULL DEFAULT 'Non-Kelas',
  -- Upload file path (bukan URL eksternal)
  poster_path         VARCHAR(500) NULL,
  description         TEXT         NULL,
  location_name       VARCHAR(500) NULL,
  location_gmaps      VARCHAR(500) NULL,
  start_date          DATETIME     NOT NULL,
  registration_deadline DATETIME   NULL,
  is_open_for_public  TINYINT(1)   NOT NULL DEFAULT 1,
  is_paid             TINYINT(1)   NOT NULL DEFAULT 0,
  price_niam          INT UNSIGNED NOT NULL DEFAULT 0,
  price_public        INT UNSIGNED NOT NULL DEFAULT 0,
  max_participants    INT UNSIGNED NULL,
  -- Dihitung otomatis via trigger
  current_participants INT UNSIGNED NOT NULL DEFAULT 0,
  status_pendaftaran  ENUM('open','closed','full') NOT NULL DEFAULT 'open',
  status              ENUM('DRAFT','PENDING','APPROVED','LIVE','FINISHED','COMPLETED')
                                   NOT NULL DEFAULT 'DRAFT',
  payment_method      ENUM('manual','gateway') NOT NULL DEFAULT 'manual',
  gateway_provider    VARCHAR(50)  NULL,
  gateway_config      JSON         NULL,
  -- FK ke bank_accounts
  bank_account_id     CHAR(36)     NULL,
  -- FK ke speakers (utama)
  speaker_id          CHAR(36)     NULL,
  gdrive_lpj          VARCHAR(500) NULL,
  created_by          CHAR(36)     NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_bank   FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_event_speaker FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL EVENT_SPEAKERS (Many-to-Many) ────────────────────
CREATE TABLE event_speakers (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  event_id        CHAR(36)     NOT NULL,
  speaker_id      CHAR(36)     NOT NULL,
  topik           VARCHAR(500) NULL,
  kelas           VARCHAR(100) NULL,
  -- NULL = Non-Kelas event
  urutan          TINYINT      NOT NULL DEFAULT 1,
  notif_sent_at   DATETIME     NULL,
  -- Waktu notif WhatsApp terkirim
  CONSTRAINT fk_es_event   FOREIGN KEY (event_id)   REFERENCES events(id)   ON DELETE CASCADE,
  CONSTRAINT fk_es_speaker FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_event_speaker (event_id, speaker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL EVENT_GUESTS ─────────────────────────────────────
CREATE TABLE event_guests (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  full_name        VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255) NULL,
  whatsapp         VARCHAR(20)  NOT NULL,
  id_card_path     VARCHAR(500) NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL EVENT_PARTICIPANTS ───────────────────────────────
CREATE TABLE event_participants (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  event_id            CHAR(36)     NOT NULL,
  crew_id             CHAR(36)     NULL,
  guest_id            CHAR(36)     NULL,
  registration_path   ENUM('NIAM','UMUM') NOT NULL,
  payment_status      ENUM('Free','Unpaid','Pending_Approval','Paid') NOT NULL DEFAULT 'Unpaid',
  unique_amount       INT UNSIGNED NOT NULL DEFAULT 0,
  payment_proof_path  VARCHAR(500) NULL,
  attendance_status   ENUM('Registered','Attended','Cancelled') NOT NULL DEFAULT 'Registered',
  qr_token            VARCHAR(100) NOT NULL UNIQUE,
  attended_at         DATETIME     NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ep_event  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT chk_ep_path  CHECK ((crew_id IS NOT NULL) XOR (guest_id IS NOT NULL)),
  INDEX idx_ep_event (event_id),
  INDEX idx_ep_qr (qr_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL EVENT_CUSTOM_FIELDS ──────────────────────────────
CREATE TABLE event_custom_fields (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  event_id      CHAR(36)     NOT NULL,
  label         VARCHAR(255) NOT NULL,
  type          ENUM('short_text','long_text','radio','dropdown','checkbox') NOT NULL,
  options       JSON         NOT NULL DEFAULT ('[]'),
  is_required   TINYINT(1)   NOT NULL DEFAULT 0,
  order_num     INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ecf_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_ecf_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABEL PARTICIPANT_RESPONSES ────────────────────────────
CREATE TABLE participant_responses (
  id              CHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  participant_id  CHAR(36)  NOT NULL,
  field_id        CHAR(36)  NOT NULL,
  response_value  JSON      NOT NULL, -- Menyimpan string tunggal atau array of string untuk checkbox
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pr_participant FOREIGN KEY (participant_id) REFERENCES event_participants(id) ON DELETE CASCADE,
  CONSTRAINT fk_pr_field FOREIGN KEY (field_id) REFERENCES event_custom_fields(id) ON DELETE CASCADE,
  INDEX idx_pr_participant (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TRIGGER: Auto-update status_pendaftaran ────────────────
DELIMITER $$

CREATE TRIGGER trg_update_quota_after_insert
AFTER INSERT ON event_participants
FOR EACH ROW BEGIN
  UPDATE events
  SET
    current_participants = (
      SELECT COUNT(*) FROM event_participants
      WHERE event_id = NEW.event_id
        AND attendance_status != 'Cancelled'
    ),
    status_pendaftaran = CASE
      WHEN max_participants IS NULL THEN 'open'
      WHEN (SELECT COUNT(*) FROM event_participants WHERE event_id = NEW.event_id AND attendance_status != 'Cancelled') >= max_participants
        THEN 'full'
      ELSE 'open'
    END
  WHERE id = NEW.event_id;
END$$

CREATE TRIGGER trg_update_quota_after_update
AFTER UPDATE ON event_participants
FOR EACH ROW BEGIN
  UPDATE events
  SET
    current_participants = (
      SELECT COUNT(*) FROM event_participants
      WHERE event_id = NEW.event_id
        AND attendance_status != 'Cancelled'
    ),
    status_pendaftaran = CASE
      WHEN max_participants IS NULL THEN 'open'
      WHEN (SELECT COUNT(*) FROM event_participants WHERE event_id = NEW.event_id AND attendance_status != 'Cancelled') >= max_participants
        THEN 'full'
      ELSE 'open'
    END
  WHERE id = NEW.event_id;
END$$

DELIMITER ;

-- ─── CRUD ENDPOINTS (Referensi untuk Laravel Controller) ────
-- GET    /api/speakers              → index (list + search)
-- POST   /api/speakers              → store (tambah narasumber)
-- GET    /api/speakers/{id}         → show
-- PUT    /api/speakers/{id}         → update
-- DELETE /api/speakers/{id}         → destroy
--
-- GET    /api/events                → index
-- POST   /api/events                → store
-- GET    /api/events/{id}           → show
-- PUT    /api/events/{id}           → update
-- DELETE /api/events/{id}           → destroy
-- POST   /api/events/{id}/speakers  → attach speaker ke event
-- POST   /api/events/{id}/notify-speakers → kirim WA notif ke speakers
-- GET    /api/speakers?keahlian=Design   → filter by keahlian
