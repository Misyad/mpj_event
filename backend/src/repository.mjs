import { randomUUID } from "node:crypto"
import { query } from "./db.mjs"

const EVENT_FIELDS = [
  "title",
  "category",
  "poster_url",
  "description",
  "location_gmaps",
  "location_name",
  "start_date",
  "is_open_for_public",
  "is_paid",
  "price_niam",
  "price_public",
  "status",
  "max_participants",
  "current_participants",
  "status_pendaftaran",
]

const EVENT_CREATE_DEFAULTS = {
  category: "Pelatihan",
  poster_url: null,
  description: "",
  location_gmaps: "",
  location_name: "",
  is_open_for_public: true,
  is_paid: false,
  price_niam: 0,
  price_public: 0,
  status: "PENDING",
  max_participants: null,
  current_participants: 0,
  status_pendaftaran: "open",
}

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
    full_name: row.full_name,
    institution_name: row.institution_name,
    whatsapp: row.whatsapp,
    checked_in_at: row.checked_in_at instanceof Date ? row.checked_in_at.toISOString() : row.checked_in_at,
    crew: parseJson(row.crew_json),
    guest: parseJson(row.guest_json),
  }
}

function toBooleanInt(value) {
  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase()) ? 1 : 0
  }

  return value ? 1 : 0
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === "") return null
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("Numeric fields must be non-negative integers")
  }

  return parsed
}

function normalizeEventPayload(payload, mode) {
  const source = mode === "create" ? { ...EVENT_CREATE_DEFAULTS, ...payload } : payload
  const normalized = {}

  if (mode === "create") {
    if (!source.title || typeof source.title !== "string") {
      throw new Error("title is required")
    }

    if (!source.start_date || Number.isNaN(Date.parse(source.start_date))) {
      throw new Error("start_date must be a valid date")
    }
  }

  for (const field of EVENT_FIELDS) {
    if (!(field in source)) continue

    const value = source[field]

    if (field === "is_open_for_public" || field === "is_paid") {
      normalized[field] = toBooleanInt(value)
    } else if (
      field === "price_niam" ||
      field === "price_public" ||
      field === "current_participants" ||
      field === "max_participants"
    ) {
      normalized[field] = toNullableInteger(value)
    } else if (field === "start_date") {
      if (Number.isNaN(Date.parse(value))) {
        throw new Error("start_date must be a valid date")
      }

      normalized[field] = new Date(value)
    } else {
      normalized[field] = value === undefined ? null : value
    }
  }

  return normalized
}

export async function listEvents() {
  const rows = await query("SELECT * FROM mpj_event_events ORDER BY start_date ASC")
  return rows.map(mapEvent)
}

export async function getEvent(id) {
  const rows = await query("SELECT * FROM mpj_event_events WHERE id = :id LIMIT 1", { id })
  return rows[0] ? mapEvent(rows[0]) : null
}

export async function createEvent(payload) {
  const id = payload.id && typeof payload.id === "string" ? payload.id : randomUUID()
  const event = normalizeEventPayload(payload, "create")

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
    { id, ...event },
  )

  return getEvent(id)
}

export async function updateEvent(id, payload) {
  const event = normalizeEventPayload(payload, "update")
  const fields = Object.keys(event)

  if (fields.length === 0) {
    throw new Error("No valid event fields were provided")
  }

  const assignments = fields.map((field) => `${field} = :${field}`).join(", ")
  const result = await query(
    `UPDATE mpj_event_events SET ${assignments} WHERE id = :id`,
    { id, ...event },
  )

  if (result.affectedRows === 0) return null
  return getEvent(id)
}

export async function deleteEvent(id) {
  const result = await query("DELETE FROM mpj_event_events WHERE id = :id", { id })
  return result.affectedRows > 0
}

export async function listParticipants(eventId) {
  const sql = eventId
    ? "SELECT * FROM mpj_event_participants WHERE event_id = :eventId ORDER BY created_at ASC"
    : "SELECT * FROM mpj_event_participants ORDER BY created_at ASC"
  const rows = await query(sql, { eventId })
  return rows.map(mapParticipant)
}

export async function getParticipantByToken(token) {
  const rows = await query(
    "SELECT * FROM mpj_event_participants WHERE qr_token = :token LIMIT 1",
    { token },
  )
  return rows[0] ? mapParticipant(rows[0]) : null
}

export async function registerParticipant(eventId, payload) {
  const event = await getEvent(eventId)

  if (!event) {
    throw new Error("Event not found")
  }

  if (event.status_pendaftaran === "closed") {
    throw new Error("Event registration is closed")
  }

  if (event.max_participants !== null && event.current_participants >= event.max_participants) {
    throw new Error("Event quota is full")
  }

  const registrationPath = payload.registration_path === "NIAM" ? "NIAM" : "UMUM"
  const fullName = String(payload.full_name || payload.name || "").trim()

  if (!fullName) {
    throw new Error("full_name is required")
  }

  const id = randomUUID()
  const qrToken = `MPJ-${eventId}-${randomUUID()}`
  const guest = registrationPath === "UMUM"
    ? {
        full_name: fullName,
        institution_name: payload.institution_name || "",
        whatsapp: payload.whatsapp || "",
      }
    : null
  const crew = registrationPath === "NIAM"
    ? {
        niam: payload.niam || "",
        full_name: fullName,
        unit: payload.unit || "",
      }
    : null

  await query(
    `
      INSERT INTO mpj_event_participants (
        id, event_id, registration_path, payment_status,
        attendance_status, qr_token, crew_json, guest_json,
        full_name, institution_name, whatsapp
      ) VALUES (
        :id, :event_id, :registration_path, :payment_status,
        :attendance_status, :qr_token, :crew_json, :guest_json,
        :full_name, :institution_name, :whatsapp
      )
    `,
    {
      id,
      event_id: eventId,
      registration_path: registrationPath,
      payment_status: event.is_paid ? "Unpaid" : "Free",
      attendance_status: "Registered",
      qr_token: qrToken,
      crew_json: crew ? JSON.stringify(crew) : null,
      guest_json: guest ? JSON.stringify(guest) : null,
      full_name: fullName,
      institution_name: payload.institution_name || null,
      whatsapp: payload.whatsapp || null,
    },
  )

  await query(
    "UPDATE mpj_event_events SET current_participants = current_participants + 1 WHERE id = :eventId",
    { eventId },
  )

  return getParticipantByToken(qrToken)
}

export async function checkInParticipant(token) {
  const participant = await getParticipantByToken(token)

  if (!participant) return null

  if (participant.attendance_status === "Attended") {
    return participant
  }

  await query(
    `
      UPDATE mpj_event_participants
      SET attendance_status = 'Attended', checked_in_at = NOW()
      WHERE qr_token = :token
    `,
    { token },
  )

  return getParticipantByToken(token)
}
