import { events, participants } from "./data.mjs"
import { query } from "./db.mjs"

export async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS mpj_event_events (
      id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      poster_url TEXT NULL,
      description TEXT NULL,
      location_gmaps TEXT NULL,
      location_name VARCHAR(255) NULL,
      start_date DATETIME NOT NULL,
      is_open_for_public TINYINT(1) NOT NULL DEFAULT 0,
      is_paid TINYINT(1) NOT NULL DEFAULT 0,
      price_niam INT NOT NULL DEFAULT 0,
      price_public INT NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL,
      max_participants INT NULL,
      current_participants INT NOT NULL DEFAULT 0,
      status_pendaftaran VARCHAR(50) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY mpj_event_events_status_idx (status),
      KEY mpj_event_events_start_date_idx (start_date)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS mpj_event_participants (
      id VARCHAR(36) NOT NULL,
      event_id VARCHAR(36) NOT NULL,
      registration_path VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) NOT NULL,
      attendance_status VARCHAR(50) NOT NULL,
      qr_token VARCHAR(120) NOT NULL,
      crew_json JSON NULL,
      guest_json JSON NULL,
      full_name VARCHAR(255) NULL,
      institution_name VARCHAR(255) NULL,
      whatsapp VARCHAR(50) NULL,
      checked_in_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY mpj_event_participants_qr_token_key (qr_token),
      KEY mpj_event_participants_event_id_idx (event_id),
      CONSTRAINT mpj_event_participants_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES mpj_event_events(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await ensureColumn("mpj_event_participants", "full_name", "VARCHAR(255) NULL")
  await ensureColumn("mpj_event_participants", "institution_name", "VARCHAR(255) NULL")
  await ensureColumn("mpj_event_participants", "whatsapp", "VARCHAR(50) NULL")
  await ensureColumn("mpj_event_participants", "checked_in_at", "DATETIME NULL")
}

async function ensureColumn(tableName, columnName, definition) {
  const rows = await query(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = :tableName
        AND COLUMN_NAME = :columnName
    `,
    { tableName, columnName },
  )

  if (Number(rows[0]?.total || 0) === 0) {
    await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
  }
}

export async function seedInitialData() {
  const eventRows = await query("SELECT COUNT(*) AS total FROM mpj_event_events")

  if (Number(eventRows[0]?.total || 0) === 0) {
    for (const event of events) {
      await query(
        `
          INSERT INTO mpj_event_events (
            id, title, category, poster_url, description, location_gmaps,
            location_name, start_date, is_open_for_public, is_paid,
            price_niam, price_public, status, max_participants,
            current_participants, status_pendaftaran
          ) VALUES (
            :id, :title, :category, :poster_url, :description, :location_gmaps,
            :location_name, :start_date, :is_open_for_public, :is_paid,
            :price_niam, :price_public, :status, :max_participants,
            :current_participants, :status_pendaftaran
          )
        `,
        {
          ...event,
          is_open_for_public: event.is_open_for_public ? 1 : 0,
          is_paid: event.is_paid ? 1 : 0,
          max_participants: event.max_participants ?? null,
          current_participants: event.current_participants ?? 0,
          status_pendaftaran: event.status_pendaftaran ?? null,
        },
      )
    }
  }

  const participantRows = await query("SELECT COUNT(*) AS total FROM mpj_event_participants")

  if (Number(participantRows[0]?.total || 0) === 0) {
    for (const participant of participants) {
      await query(
        `
          INSERT INTO mpj_event_participants (
            id, event_id, registration_path, payment_status,
            attendance_status, qr_token, crew_json, guest_json
          ) VALUES (
            :id, :event_id, :registration_path, :payment_status,
            :attendance_status, :qr_token, :crew_json, :guest_json
          )
        `,
        {
          ...participant,
          crew_json: participant.crew ? JSON.stringify(participant.crew) : null,
          guest_json: participant.guest ? JSON.stringify(participant.guest) : null,
        },
      )
    }
  }
}

export async function bootstrapDatabase() {
  await ensureSchema()
  await seedInitialData()
}
