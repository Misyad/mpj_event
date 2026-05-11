import { events, participants } from "./data.mjs"
import { query } from "./db.mjs"

export async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS events (
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
      KEY events_status_idx (status),
      KEY events_start_date_idx (start_date)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS participants (
      id VARCHAR(36) NOT NULL,
      event_id VARCHAR(36) NOT NULL,
      registration_path VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) NOT NULL,
      attendance_status VARCHAR(50) NOT NULL,
      qr_token VARCHAR(120) NOT NULL,
      crew_json JSON NULL,
      guest_json JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY participants_qr_token_key (qr_token),
      KEY participants_event_id_idx (event_id),
      CONSTRAINT participants_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
}

export async function seedInitialData() {
  const eventRows = await query("SELECT COUNT(*) AS total FROM events")

  if (Number(eventRows[0]?.total || 0) === 0) {
    for (const event of events) {
      await query(
        `
          INSERT INTO events (
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

  const participantRows = await query("SELECT COUNT(*) AS total FROM participants")

  if (Number(participantRows[0]?.total || 0) === 0) {
    for (const participant of participants) {
      await query(
        `
          INSERT INTO participants (
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
