import { query } from "./db.mjs"

function mapEvent(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    poster_url: row.poster_url,
    description: row.description,
    location_gmaps: row.location_gmaps,
    location_name: row.location_name,
    start_date: row.start_date instanceof Date ? row.start_date.toISOString() : row.start_date,
    is_open_for_public: Boolean(row.is_open_for_public),
    is_paid: Boolean(row.is_paid),
    price_niam: Number(row.price_niam),
    price_public: Number(row.price_public),
    status: row.status,
    max_participants: row.max_participants === null ? null : Number(row.max_participants),
    current_participants: Number(row.current_participants),
    status_pendaftaran: row.status_pendaftaran,
  }
}

function parseJson(value) {
  if (!value) return undefined
  if (typeof value === "object") return value
  return JSON.parse(value)
}

function mapParticipant(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    registration_path: row.registration_path,
    payment_status: row.payment_status,
    attendance_status: row.attendance_status,
    qr_token: row.qr_token,
    crew: parseJson(row.crew_json),
    guest: parseJson(row.guest_json),
  }
}

export async function listEvents() {
  const rows = await query("SELECT * FROM events ORDER BY start_date ASC")
  return rows.map(mapEvent)
}

export async function getEvent(id) {
  const rows = await query("SELECT * FROM events WHERE id = :id LIMIT 1", { id })
  return rows[0] ? mapEvent(rows[0]) : null
}

export async function listParticipants(eventId) {
  const sql = eventId
    ? "SELECT * FROM participants WHERE event_id = :eventId ORDER BY created_at ASC"
    : "SELECT * FROM participants ORDER BY created_at ASC"
  const rows = await query(sql, { eventId })
  return rows.map(mapParticipant)
}

export async function getParticipantByToken(token) {
  const rows = await query(
    "SELECT * FROM participants WHERE qr_token = :token LIMIT 1",
    { token },
  )
  return rows[0] ? mapParticipant(rows[0]) : null
}
