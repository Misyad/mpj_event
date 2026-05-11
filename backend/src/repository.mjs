import { randomUUID } from "node:crypto"
import { query } from "./db.mjs"

const EVENT_FIELDS = [
  "title",
  "category",
  "poster_url",
  "slug",
  "description",
  "location_gmaps",
  "location_name",
  "location_type",
  "meeting_url",
  "start_date",
  "end_date",
  "is_open_for_public",
  "is_paid",
  "price_niam",
  "price_public",
  "status",
  "scope",
  "region_id",
  "is_published",
  "is_public",
  "max_participants",
  "current_participants",
  "attended_count",
  "status_pendaftaran",
  "registration_deadline",
]

const EVENT_CREATE_DEFAULTS = {
  category: "Pelatihan",
  slug: null,
  poster_url: null,
  description: "",
  location_gmaps: "",
  location_name: "",
  location_type: "offline",
  meeting_url: null,
  is_open_for_public: true,
  is_paid: false,
  price_niam: 0,
  price_public: 0,
  status: "draft",
  scope: "pusat",
  region_id: null,
  is_published: false,
  is_public: true,
  max_participants: null,
  current_participants: 0,
  attended_count: 0,
  status_pendaftaran: "open",
  registration_deadline: null,
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function mapEvent(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug || slugify(row.title),
    category: row.category,
    poster_url: row.poster_url,
    posterUrl: row.poster_url,
    description: row.description,
    location_gmaps: row.location_gmaps,
    locationMapsUrl: row.location_gmaps,
    location_name: row.location_name,
    location: row.location_name,
    locationType: row.location_type || "offline",
    meetingUrl: row.meeting_url,
    start_date: row.start_date instanceof Date ? row.start_date.toISOString() : row.start_date,
    dateStart: row.start_date instanceof Date ? row.start_date.toISOString() : row.start_date,
    dateEnd: row.end_date instanceof Date ? row.end_date.toISOString() : row.end_date,
    is_open_for_public: Boolean(row.is_open_for_public),
    allowPublic: Boolean(row.is_open_for_public),
    is_paid: Boolean(row.is_paid),
    isPaidEvent: Boolean(row.is_paid),
    price_niam: Number(row.price_niam),
    priceNiam: Number(row.price_niam),
    price_public: Number(row.price_public),
    priceUmum: Number(row.price_public),
    status: row.status,
    scope: row.scope || "pusat",
    regionId: row.region_id,
    isPublished: Boolean(row.is_published),
    isPublic: Boolean(row.is_public),
    max_participants: row.max_participants === null ? null : Number(row.max_participants),
    quota: row.max_participants === null ? null : Number(row.max_participants),
    current_participants: Number(row.current_participants),
    registeredCount: Number(row.current_participants),
    attendedCount: Number(row.attended_count || 0),
    status_pendaftaran: row.status_pendaftaran,
    registrationDeadline: row.registration_deadline instanceof Date ? row.registration_deadline.toISOString() : row.registration_deadline,
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
    status: row.status || row.attendance_status,
    qr_token: row.qr_token,
    ticketCode: row.ticket_code || row.qr_token,
    paymentId: row.payment_id,
    full_name: row.full_name,
    fullName: row.full_name,
    email: row.email,
    institution_name: row.institution_name,
    institution: row.institution_name,
    whatsapp: row.whatsapp,
    checked_in_at: row.checked_in_at instanceof Date ? row.checked_in_at.toISOString() : row.checked_in_at,
    attendedAt: row.attended_at instanceof Date ? row.attended_at.toISOString() : row.attended_at,
    customAnswers: parseJson(row.custom_answers) || {},
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
    } else if (field === "start_date" || field === "end_date" || field === "registration_deadline") {
      if (!value) {
        normalized[field] = null
        continue
      }
      if (Number.isNaN(Date.parse(value))) {
        throw new Error(`${field} must be a valid date`)
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
  const rows = await query("SELECT * FROM mpj_event_events WHERE id = :id OR slug = :id LIMIT 1", { id })
  return rows[0] ? mapEvent(rows[0]) : null
}

export async function createEvent(payload) {
  const id = payload.id && typeof payload.id === "string" ? payload.id : randomUUID()
  const event = normalizeEventPayload(payload, "create")

  await query(
    `
      INSERT INTO mpj_event_events (
        id, title, slug, category, poster_url, description, location_gmaps,
        location_name, location_type, meeting_url, start_date, end_date, is_open_for_public, is_paid,
        price_niam, price_public, status, scope, region_id, is_published, is_public, max_participants,
        current_participants, attended_count, status_pendaftaran, registration_deadline
      ) VALUES (
        :id, :title, :slug, :category, :poster_url, :description, :location_gmaps,
        :location_name, :location_type, :meeting_url, :start_date, :end_date, :is_open_for_public, :is_paid,
        :price_niam, :price_public, :status, :scope, :region_id, :is_published, :is_public, :max_participants,
        :current_participants, :attended_count, :status_pendaftaran, :registration_deadline
      )
    `,
    { id, ...event, slug: event.slug || slugify(event.title) },
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
    "SELECT * FROM mpj_event_participants WHERE qr_token = :token OR ticket_code = :token LIMIT 1",
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
        attendance_status, status, qr_token, ticket_code, crew_json, guest_json,
        full_name, institution_name, whatsapp, niam, email, class_id, custom_answers
      ) VALUES (
        :id, :event_id, :registration_path, :payment_status,
        :attendance_status, :status, :qr_token, :qr_token, :crew_json, :guest_json,
        :full_name, :institution_name, :whatsapp, :niam, :email, :class_id, :custom_answers
      )
    `,
    {
      id,
      event_id: eventId,
      registration_path: registrationPath,
      payment_status: event.is_paid ? "Unpaid" : "Free",
      attendance_status: event.is_paid ? "Registered" : "Confirmed",
      status: event.is_paid ? "registered" : "confirmed",
      qr_token: qrToken,
      crew_json: crew ? JSON.stringify(crew) : null,
      guest_json: guest ? JSON.stringify(guest) : null,
      full_name: fullName,
      institution_name: payload.institution_name || null,
      whatsapp: payload.whatsapp || null,
      niam: payload.niam || null,
      email: payload.email || null,
      class_id: payload.class_id || null,
      custom_answers: JSON.stringify(payload.custom_answers || payload.customAnswers || {}),
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

  if (participant.status === "attended" || participant.attendance_status === "Attended") {
    return participant
  }

  if (participant.status !== "confirmed" && participant.attendance_status !== "Confirmed") {
    throw new Error("QR is not active until participant is confirmed")
  }

  await query(
    `
      UPDATE mpj_event_participants
      SET status = 'attended', attendance_status = 'Attended', attended_at = NOW(), checked_in_at = NOW()
      WHERE qr_token = :token OR ticket_code = :token
    `,
    { token },
  )

  return getParticipantByToken(token)
}

export async function confirmParticipantFromPayment(payload) {
  if (payload.sourceType !== "event_registration") {
    throw new Error("Payment source type is not valid for event module")
  }

  const participantId = String(payload.sourceId || "").trim()
  if (!participantId) {
    throw new Error("sourceId is required")
  }

  const status = String(payload.status || "verified").toLowerCase()
  if (!["verified", "paid", "success", "confirmed"].includes(status)) {
    throw new Error("Payment is not verified")
  }

  await query(
    `
      UPDATE mpj_event_participants
      SET status = 'confirmed',
        attendance_status = 'Confirmed',
        payment_status = 'Paid',
        payment_id = COALESCE(:paymentId, payment_id)
      WHERE id = :participantId
    `,
    {
      participantId,
      paymentId: payload.paymentId || null,
    },
  )

  const rows = await query("SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1", { participantId })
  if (!rows[0]) throw new Error("Participant not found")
  return mapParticipant(rows[0])
}
