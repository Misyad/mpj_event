import { randomUUID } from 'crypto'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { Event, EventCategory, EventScope, LocationType, Participant, RegistrationStatus } from '@/types'
import { withDb } from '@/lib/server/db'

const DEFAULT_BANK_ACCOUNT = {
  bank_name: 'BCA',
  account_number: '1234567890',
  account_name: 'MPJ Indonesia',
}

type EventRow = RowDataPacket & {
  id: string
  title: string
  slug: string | null
  category: EventCategory
  poster_url: string | null
  description: string | null
  location_gmaps: string | null
  location_name: string | null
  location_type: LocationType | null
  meeting_url: string | null
  start_date: Date | string
  end_date: Date | string | null
  is_open_for_public: 0 | 1
  is_paid: 0 | 1
  price_niam: number
  price_public: number
  status: string
  scope: EventScope | null
  region_id: string | null
  is_published: 0 | 1 | null
  is_public: 0 | 1 | null
  max_participants: number | null
  current_participants: number | null
  attended_count: number | null
  status_pendaftaran: RegistrationStatus | null
  registration_deadline: Date | string | null
}

type ParticipantRow = RowDataPacket & {
  id: string
  event_id: string
  registration_path: 'NIAM' | 'UMUM'
  payment_status: string
  attendance_status: string
  qr_token: string
  crew_json: string | Record<string, unknown> | null
  guest_json: string | Record<string, unknown> | null
  full_name: string | null
  institution_name: string | null
  whatsapp: string | null
  checked_in_at: Date | string | null
  user_id: string | null
  niam: string | null
  email: string | null
  class_id: string | null
  status: string | null
  ticket_code: string | null
  attended_at: Date | string | null
  payment_id: string | null
  custom_answers: string | Record<string, unknown> | null
}

type RegisterPayload = {
  registration_path?: 'NIAM' | 'UMUM'
  full_name?: string
  name?: string
  niam?: string
  unit?: string
  institution_name?: string
  institution?: string
  whatsapp?: string
  email?: string
  class_id?: string
  custom_responses?: Record<string, unknown>
  customAnswers?: Record<string, unknown>
}

type EventPayload = {
  title?: string
  slug?: string
  category?: EventCategory
  poster_url?: string
  posterUrl?: string
  description?: string
  location_gmaps?: string
  locationMapsUrl?: string
  location_name?: string
  location?: string
  location_type?: LocationType
  locationType?: LocationType
  meeting_url?: string
  meetingUrl?: string
  start_date?: string
  dateStart?: string
  end_date?: string
  dateEnd?: string
  is_open_for_public?: boolean
  allowPublic?: boolean
  is_paid?: boolean
  isPaidEvent?: boolean
  price_niam?: number
  priceNiam?: number
  price_public?: number
  priceUmum?: number
  status?: string
  scope?: EventScope
  region_id?: string | null
  regionId?: string | null
  is_published?: boolean
  isPublished?: boolean
  is_public?: boolean
  isPublic?: boolean
  max_participants?: number | null
  quota?: number | null
  registration_deadline?: string | null
  registrationDeadline?: string | null
}

function toIsoString(value: Date | string | null) {
  if (!value) return undefined
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function toLegacyEventStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'draft') return 'DRAFT'
  if (normalized === 'pending') return 'PENDING'
  if (normalized === 'approved') return 'APPROVED'
  if (normalized === 'registration_closed') return 'APPROVED'
  if (normalized === 'finished') return 'FINISHED'
  return status.toUpperCase()
}

function toV4EventStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'draft') return 'draft'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'approved' || normalized === 'live') return 'approved'
  if (normalized === 'registration_closed') return 'registration_closed'
  if (normalized === 'finished' || normalized === 'completed') return 'finished'
  return 'draft'
}

function toBooleanInt(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value ? 1 : 0
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase()) ? 1 : 0
  return fallback ? 1 : 0
}

function toNullableDate(value: unknown) {
  if (!value || typeof value !== 'string') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Tanggal event tidak valid')
  return date
}

function toNullableInteger(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error('Angka harus berupa integer positif')
  return parsed
}

function mapEvent(row: EventRow): Event {
  const dateStart = toIsoString(row.start_date) ?? new Date().toISOString()
  const dateEnd = toIsoString(row.end_date)
  const registrationDeadline = toIsoString(row.registration_deadline)
  const quota = row.max_participants ?? undefined
  const registeredCount = row.current_participants ?? 0
  const attendedCount = row.attended_count ?? 0
  const status = toLegacyEventStatus(row.status)
  const v4Status = toV4EventStatus(row.status)
  const slug = row.slug || slugify(row.title)

  return {
    id: row.id,
    title: row.title,
    slug,
    category: row.category,
    poster_url: row.poster_url || 'https://picsum.photos/seed/mpj-event/800/450',
    posterUrl: row.poster_url || 'https://picsum.photos/seed/mpj-event/800/450',
    description: row.description ?? '',
    location_gmaps: row.location_gmaps ?? '',
    locationMapsUrl: row.location_gmaps ?? '',
    location_name: row.location_name ?? '',
    location: row.location_name ?? '',
    locationType: row.location_type ?? 'offline',
    meetingUrl: row.meeting_url ?? undefined,
    start_date: dateStart,
    dateStart,
    dateEnd,
    is_open_for_public: Boolean(row.is_open_for_public),
    allowPublic: Boolean(row.is_open_for_public),
    is_paid: Boolean(row.is_paid),
    isPaidEvent: Boolean(row.is_paid),
    price_niam: Number(row.price_niam ?? 0),
    priceNiam: Number(row.price_niam ?? 0),
    price_public: Number(row.price_public ?? 0),
    priceUmum: Number(row.price_public ?? 0),
    status: status as Event['status'],
    scope: row.scope ?? 'pusat',
    regionId: row.region_id,
    isPublished: Boolean(row.is_published),
    isPublic: Boolean(row.is_public),
    bank_account: DEFAULT_BANK_ACCOUNT,
    max_participants: quota,
    quota,
    current_participants: registeredCount,
    registeredCount,
    attendedCount,
    status_pendaftaran: row.status_pendaftaran ?? (v4Status === 'registration_closed' ? 'closed' : 'open'),
    registration_deadline: registrationDeadline,
    registrationDeadline,
    custom_fields: [],
  }
}

function parseJson<T>(value: unknown): T | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value as T

  try {
    return JSON.parse(String(value)) as T
  } catch {
    return undefined
  }
}

function mapParticipant(row: ParticipantRow): Participant {
  const customAnswers = parseJson<Record<string, unknown>>(row.custom_answers) ?? {}
  const crew = parseJson<Participant['crew']>(row.crew_json)
  const guest = parseJson<Participant['guest']>(row.guest_json)
  const status = (row.status || row.attendance_status || 'registered') as NonNullable<Participant['status']>
  const ticketCode = row.ticket_code || row.qr_token
  const attendedAt = toIsoString(row.attended_at) ?? toIsoString(row.checked_in_at) ?? null

  return {
    id: row.id,
    event_id: row.event_id,
    eventId: row.event_id,
    registration_path: row.registration_path,
    type: row.registration_path === 'NIAM' ? 'niam' : 'umum',
    payment_status: row.payment_status as Participant['payment_status'],
    unique_amount: 0,
    payment_proof_url: null,
    attendance_status: status as Participant['attendance_status'],
    status,
    qr_token: ticketCode,
    ticketCode,
    paymentId: row.payment_id,
    full_name: row.full_name ?? crew?.full_name ?? guest?.full_name,
    fullName: row.full_name ?? crew?.full_name ?? guest?.full_name,
    email: row.email,
    institution_name: row.institution_name ?? guest?.institution_name,
    institution: row.institution_name ?? guest?.institution_name,
    whatsapp: row.whatsapp ?? guest?.whatsapp,
    checked_in_at: attendedAt,
    attendedAt,
    crew,
    guest,
    customAnswers,
  }
}

async function ensureColumn(connection: PoolConnection, tableName: string, columnName: string, definition: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
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
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
  }
}

export async function ensureEventV4Schema(connection: PoolConnection) {
  await ensureColumn(connection, 'mpj_event_events', 'slug', 'VARCHAR(160) NULL')
  await ensureColumn(connection, 'mpj_event_events', 'end_date', 'DATETIME NULL')
  await ensureColumn(connection, 'mpj_event_events', 'location_type', "VARCHAR(20) NOT NULL DEFAULT 'offline'")
  await ensureColumn(connection, 'mpj_event_events', 'meeting_url', 'TEXT NULL')
  await ensureColumn(connection, 'mpj_event_events', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'pusat'")
  await ensureColumn(connection, 'mpj_event_events', 'region_id', 'VARCHAR(36) NULL')
  await ensureColumn(connection, 'mpj_event_events', 'is_published', 'TINYINT(1) NOT NULL DEFAULT 0')
  await ensureColumn(connection, 'mpj_event_events', 'is_public', 'TINYINT(1) NOT NULL DEFAULT 1')
  await ensureColumn(connection, 'mpj_event_events', 'attended_count', 'INT NOT NULL DEFAULT 0')
  await ensureColumn(connection, 'mpj_event_events', 'registration_deadline', 'DATETIME NULL')

  await ensureColumn(connection, 'mpj_event_participants', 'user_id', 'VARCHAR(36) NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'niam', 'VARCHAR(50) NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'email', 'VARCHAR(255) NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'class_id', 'VARCHAR(36) NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'status', "VARCHAR(50) NOT NULL DEFAULT 'registered'")
  await ensureColumn(connection, 'mpj_event_participants', 'ticket_code', 'VARCHAR(120) NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'attended_at', 'DATETIME NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'payment_id', 'VARCHAR(120) NULL')
  await ensureColumn(connection, 'mpj_event_participants', 'custom_answers', 'JSON NULL')

  await connection.query(`
    CREATE TABLE IF NOT EXISTS mpj_event_classes (
      id VARCHAR(36) NOT NULL,
      event_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      quota INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY mpj_event_classes_event_id_idx (event_id)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS mpj_event_custom_fields (
      id VARCHAR(36) NOT NULL,
      event_id VARCHAR(36) NOT NULL,
      label VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      required TINYINT(1) NOT NULL DEFAULT 0,
      options JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY mpj_event_custom_fields_event_id_idx (event_id)
    )
  `)

  await connection.query(`
    UPDATE mpj_event_events
    SET
      slug = LOWER(REPLACE(REPLACE(REPLACE(TRIM(title), ' ', '-'), '/', '-'), '--', '-'))
    WHERE slug IS NULL OR slug = ''
  `)

  await connection.query(`
    UPDATE mpj_event_events
    SET
      is_published = CASE WHEN UPPER(status) IN ('APPROVED', 'LIVE', 'FINISHED', 'COMPLETED') THEN 1 ELSE is_published END,
      is_public = CASE WHEN is_public IS NULL THEN 1 ELSE is_public END
  `)

  await connection.query(`
    UPDATE mpj_event_participants
    SET
      ticket_code = COALESCE(ticket_code, qr_token),
      status = CASE
        WHEN LOWER(attendance_status) = 'attended' THEN 'attended'
        WHEN LOWER(payment_status) IN ('paid', 'free') THEN 'confirmed'
        WHEN LOWER(attendance_status) = 'cancelled' THEN 'cancelled'
        ELSE 'registered'
      END
    WHERE ticket_code IS NULL OR ticket_code = '' OR status IS NULL OR status = 'registered'
  `)
}

const EVENT_SELECT = `
  SELECT
    id,
    title,
    slug,
    category,
    poster_url,
    description,
    location_gmaps,
    location_name,
    location_type,
    meeting_url,
    start_date,
    end_date,
    is_open_for_public,
    is_paid,
    price_niam,
    price_public,
    status,
    scope,
    region_id,
    is_published,
    is_public,
    max_participants,
    current_participants,
    attended_count,
    status_pendaftaran,
    registration_deadline
  FROM mpj_event_events
`

export async function getEventsFromDb(options: { publicOnly?: boolean } = {}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      const [rows] = await connection.query<EventRow[]>(`${EVENT_SELECT} ORDER BY start_date ASC`)
      const events = rows.map(mapEvent)
      return options.publicOnly ? events.filter((event) => event.isPublished && event.isPublic) : events
    } finally {
      connection.release()
    }
  })
}

export async function getEventFromDb(identifier: string, options: { publicOnly?: boolean } = {}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      const [rows] = await connection.query<EventRow[]>(
        `
          ${EVENT_SELECT}
          WHERE id = :identifier OR slug = :identifier
          LIMIT 1
        `,
        { identifier },
      )
      const event = rows[0] ? mapEvent(rows[0]) : null
      if (!event) return null
      if (options.publicOnly && !event.isPublished) return null
      return event
    } finally {
      connection.release()
    }
  })
}

export async function getParticipantByTicketCode(ticketCode: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      const [rows] = await connection.query<ParticipantRow[]>(
        `
          SELECT *
          FROM mpj_event_participants
          WHERE ticket_code = :ticketCode OR qr_token = :ticketCode
          LIMIT 1
        `,
        { ticketCode },
      )
      return rows[0] ? mapParticipant(rows[0]) : null
    } finally {
      connection.release()
    }
  })
}

export async function createEventInDb(payload: EventPayload) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)

      const title = getString(payload.title)
      if (!title) throw new Error('Nama event wajib diisi')

      const startDate = toNullableDate(payload.start_date ?? payload.dateStart)
      if (!startDate) throw new Error('Tanggal event wajib diisi')

      const id = randomUUID()
      const slug = getString(payload.slug) || slugify(title)
      const status = payload.status || 'draft'
      const isPublished = Boolean(payload.isPublished ?? payload.is_published ?? false)

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO mpj_event_events (
            id, title, slug, category, poster_url, description, location_gmaps,
            location_name, location_type, meeting_url, start_date, end_date,
            is_open_for_public, is_paid, price_niam, price_public, status,
            scope, region_id, is_published, is_public, max_participants,
            current_participants, attended_count, status_pendaftaran, registration_deadline
          ) VALUES (
            :id, :title, :slug, :category, :posterUrl, :description, :locationMapsUrl,
            :locationName, :locationType, :meetingUrl, :startDate, :endDate,
            :allowPublic, :isPaid, :priceNiam, :priceUmum, :status,
            :scope, :regionId, :isPublished, :isPublic, :quota,
            0, 0, :registrationStatus, :registrationDeadline
          )
        `,
        {
          id,
          title,
          slug,
          category: payload.category || 'Pelatihan',
          posterUrl: getString(payload.poster_url || payload.posterUrl) || null,
          description: getString(payload.description),
          locationMapsUrl: getString(payload.location_gmaps || payload.locationMapsUrl),
          locationName: getString(payload.location_name || payload.location),
          locationType: payload.location_type || payload.locationType || 'offline',
          meetingUrl: getString(payload.meeting_url || payload.meetingUrl) || null,
          startDate,
          endDate: toNullableDate(payload.end_date ?? payload.dateEnd),
          allowPublic: toBooleanInt(payload.allowPublic ?? payload.is_open_for_public, true),
          isPaid: toBooleanInt(payload.isPaidEvent ?? payload.is_paid),
          priceNiam: toNullableInteger(payload.priceNiam ?? payload.price_niam) ?? 0,
          priceUmum: toNullableInteger(payload.priceUmum ?? payload.price_public) ?? 0,
          status,
          scope: payload.scope || 'pusat',
          regionId: payload.regionId ?? payload.region_id ?? null,
          isPublished: toBooleanInt(isPublished),
          isPublic: toBooleanInt(payload.isPublic ?? payload.is_public, true),
          quota: toNullableInteger(payload.quota ?? payload.max_participants),
          registrationStatus: status === 'registration_closed' ? 'closed' : 'open',
          registrationDeadline: toNullableDate(payload.registrationDeadline ?? payload.registration_deadline),
        },
      )

      const event = await getEventFromDb(id)
      if (!event) throw new Error('Gagal membuat event')
      return event
    } finally {
      connection.release()
    }
  })
}

export async function updateEventInDb(identifier: string, payload: EventPayload) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)

      const [existingRows] = await connection.query<EventRow[]>(
        `${EVENT_SELECT} WHERE id = :identifier OR slug = :identifier LIMIT 1`,
        { identifier },
      )
      const existing = existingRows[0]
      if (!existing) return null

      const assignments: string[] = []
      const values: Record<string, unknown> = { id: existing.id }
      const published = Boolean(existing.is_published) || toV4EventStatus(existing.status) === 'approved'

      function setField(column: string, key: string, value: unknown) {
        assignments.push(`${column} = :${key}`)
        values[key] = value
      }

      if (payload.title !== undefined) {
        const title = getString(payload.title)
        if (!title) throw new Error('Nama event wajib diisi')
        setField('title', 'title', title)
        if (!payload.slug && !existing.slug) setField('slug', 'slug', slugify(title))
      }
      if (payload.slug !== undefined) setField('slug', 'slugPayload', getString(payload.slug) || slugify(existing.title))
      if (payload.category !== undefined) setField('category', 'category', payload.category)
      if (payload.poster_url !== undefined || payload.posterUrl !== undefined) setField('poster_url', 'posterUrl', getString(payload.poster_url || payload.posterUrl) || null)
      if (payload.description !== undefined) setField('description', 'description', getString(payload.description))
      if (payload.location_gmaps !== undefined || payload.locationMapsUrl !== undefined) setField('location_gmaps', 'locationMapsUrl', getString(payload.location_gmaps || payload.locationMapsUrl))
      if (payload.location_name !== undefined || payload.location !== undefined) setField('location_name', 'locationName', getString(payload.location_name || payload.location))
      if (payload.location_type !== undefined || payload.locationType !== undefined) setField('location_type', 'locationType', payload.location_type || payload.locationType || 'offline')
      if (payload.meeting_url !== undefined || payload.meetingUrl !== undefined) setField('meeting_url', 'meetingUrl', getString(payload.meeting_url || payload.meetingUrl) || null)
      if (payload.start_date !== undefined || payload.dateStart !== undefined) setField('start_date', 'startDate', toNullableDate(payload.start_date ?? payload.dateStart))
      if (payload.end_date !== undefined || payload.dateEnd !== undefined) setField('end_date', 'endDate', toNullableDate(payload.end_date ?? payload.dateEnd))
      if (payload.is_open_for_public !== undefined || payload.allowPublic !== undefined) setField('is_open_for_public', 'allowPublic', toBooleanInt(payload.allowPublic ?? payload.is_open_for_public))
      if (payload.is_paid !== undefined || payload.isPaidEvent !== undefined) setField('is_paid', 'isPaid', toBooleanInt(payload.isPaidEvent ?? payload.is_paid))
      if (payload.price_niam !== undefined || payload.priceNiam !== undefined) {
        if (published) throw new Error('Harga tidak boleh diubah setelah publish')
        setField('price_niam', 'priceNiam', toNullableInteger(payload.priceNiam ?? payload.price_niam) ?? 0)
      }
      if (payload.price_public !== undefined || payload.priceUmum !== undefined) {
        if (published) throw new Error('Harga tidak boleh diubah setelah publish')
        setField('price_public', 'priceUmum', toNullableInteger(payload.priceUmum ?? payload.price_public) ?? 0)
      }
      if (payload.status !== undefined) {
        const status = payload.status
        setField('status', 'status', status)
        if (status === 'approved' || status === 'APPROVED') setField('is_published', 'publishedFromStatus', 1)
        if (status === 'registration_closed') setField('status_pendaftaran', 'registrationStatusFromStatus', 'closed')
        if (status === 'finished' || status === 'FINISHED') setField('status_pendaftaran', 'registrationStatusFinished', 'closed')
      }
      if (payload.scope !== undefined) setField('scope', 'scope', payload.scope)
      if (payload.regionId !== undefined || payload.region_id !== undefined) setField('region_id', 'regionId', payload.regionId ?? payload.region_id ?? null)
      if (payload.isPublished !== undefined || payload.is_published !== undefined) {
        if ((payload.isPublished ?? payload.is_published) && toV4EventStatus(existing.status) !== 'approved') {
          throw new Error('Event harus approved sebelum publish')
        }
        setField('is_published', 'isPublished', toBooleanInt(payload.isPublished ?? payload.is_published))
      }
      if (payload.isPublic !== undefined || payload.is_public !== undefined) setField('is_public', 'isPublic', toBooleanInt(payload.isPublic ?? payload.is_public))
      if (payload.max_participants !== undefined || payload.quota !== undefined) setField('max_participants', 'quota', toNullableInteger(payload.quota ?? payload.max_participants))
      if (payload.registrationDeadline !== undefined || payload.registration_deadline !== undefined) setField('registration_deadline', 'registrationDeadline', toNullableDate(payload.registrationDeadline ?? payload.registration_deadline))

      if (assignments.length === 0) throw new Error('Tidak ada field event yang bisa diperbarui')

      await connection.query<ResultSetHeader>(
        `UPDATE mpj_event_events SET ${assignments.join(', ')} WHERE id = :id`,
        values as never,
      )

      return getEventFromDb(existing.id)
    } finally {
      connection.release()
    }
  })
}

async function createPaymentCoreRequest(participantId: string, amount: number) {
  return {
    sourceType: 'event_registration',
    sourceId: participantId,
    amount,
    status: 'payment_core_not_configured',
  }
}

export async function registerEventParticipant(eventIdentifier: string, payload: RegisterPayload) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      await connection.beginTransaction()

      const [eventRows] = await connection.query<EventRow[]>(
        `
          ${EVENT_SELECT}
          WHERE id = :eventIdentifier OR slug = :eventIdentifier
          LIMIT 1
          FOR UPDATE
        `,
        { eventIdentifier },
      )
      const eventRow = eventRows[0]
      if (!eventRow) throw new Error('Event tidak ditemukan')

      const event = mapEvent(eventRow)
      const v4Status = toV4EventStatus(eventRow.status)
      if (v4Status !== 'approved') throw new Error('Pendaftaran event belum dibuka')
      if (event.status_pendaftaran === 'closed') throw new Error('Pendaftaran event sudah ditutup')
      if (event.status_pendaftaran === 'full') throw new Error('Kuota event sudah penuh')
      if (event.registrationDeadline && new Date(event.registrationDeadline).getTime() < Date.now()) {
        throw new Error('Batas waktu pendaftaran sudah berakhir')
      }
      if (event.quota && event.registeredCount && event.registeredCount >= event.quota) {
        throw new Error('Kuota event sudah penuh')
      }

      const registrationPath = payload.registration_path === 'NIAM' ? 'NIAM' : 'UMUM'
      if (registrationPath === 'UMUM' && !event.allowPublic) throw new Error('Event ini tidak membuka jalur umum')

      const fullName = getString(payload.full_name || payload.name)
      if (!fullName) throw new Error('Nama lengkap wajib diisi')

      const whatsapp = getString(payload.whatsapp)
      const email = getString(payload.email)
      const institution = getString(payload.institution_name || payload.institution)
      const niam = getString(payload.niam)

      if (registrationPath === 'NIAM' && !niam) throw new Error('NIAM wajib diisi')
      if (registrationPath === 'UMUM' && !whatsapp) throw new Error('Nomor WhatsApp wajib diisi')
      if (registrationPath === 'UMUM' && !institution) throw new Error('Instansi wajib diisi')

      const [duplicates] = await connection.query<RowDataPacket[]>(
        registrationPath === 'NIAM'
          ? `
              SELECT id FROM mpj_event_participants
              WHERE event_id = :eventId AND niam = :niam
              LIMIT 1
            `
          : `
              SELECT id FROM mpj_event_participants
              WHERE event_id = :eventId AND whatsapp = :whatsapp
              LIMIT 1
            `,
        { eventId: event.id, niam, whatsapp },
      )
      if (duplicates.length > 0) {
        throw new Error(registrationPath === 'NIAM' ? 'NIAM ini sudah terdaftar pada event ini' : 'Nomor WhatsApp ini sudah terdaftar pada event ini')
      }

      const participantId = randomUUID()
      const ticketCode = `MPJ-${event.id.slice(0, 8)}-${randomUUID()}`
      const baseAmount = event.isPaidEvent ? (registrationPath === 'NIAM' ? event.priceNiam ?? 0 : event.priceUmum ?? 0) : 0
      const participantStatus = event.isPaidEvent ? 'registered' : 'confirmed'
      const paymentStatus = event.isPaidEvent ? 'Unpaid' : 'Free'
      const paymentRequest = event.isPaidEvent ? await createPaymentCoreRequest(participantId, baseAmount) : null
      const customAnswers = payload.customAnswers ?? payload.custom_responses ?? {}
      const crew =
        registrationPath === 'NIAM'
          ? {
              niam,
              full_name: fullName,
              unit: getString(payload.unit),
            }
          : null
      const guest =
        registrationPath === 'UMUM'
          ? {
              full_name: fullName,
              institution_name: institution,
              whatsapp,
            }
          : null

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO mpj_event_participants (
            id, event_id, registration_path, payment_status,
            attendance_status, qr_token, crew_json, guest_json,
            full_name, institution_name, whatsapp, user_id, niam, email,
            class_id, status, ticket_code, payment_id, custom_answers
          ) VALUES (
            :participantId, :eventId, :registrationPath, :paymentStatus,
            :attendanceStatus, :ticketCode, :crewJson, :guestJson,
            :fullName, :institution, :whatsapp, NULL, :niam, :email,
            :classId, :participantStatus, :ticketCode, :paymentId, CAST(:customAnswers AS JSON)
          )
        `,
        {
          participantId,
          eventId: event.id,
          registrationPath,
          paymentStatus,
          attendanceStatus: participantStatus === 'confirmed' ? 'Confirmed' : 'Registered',
          ticketCode,
          crewJson: crew ? JSON.stringify(crew) : null,
          guestJson: guest ? JSON.stringify(guest) : null,
          fullName,
          institution: institution || null,
          whatsapp: whatsapp || null,
          niam: niam || null,
          email: email || null,
          classId: getString(payload.class_id) || null,
          participantStatus,
          paymentId: null,
          customAnswers: JSON.stringify(customAnswers),
        },
      )

      await connection.query<ResultSetHeader>(
        'UPDATE mpj_event_events SET current_participants = current_participants + 1 WHERE id = :eventId',
        { eventId: event.id },
      )

      const [participantRows] = await connection.query<ParticipantRow[]>(
        'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
        { participantId },
      )

      await connection.commit()
      return {
        participant: mapParticipant(participantRows[0]),
        paymentCoreRequest: paymentRequest,
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  })
}

export async function checkInTicket(ticketCode: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      await connection.beginTransaction()

      const [rows] = await connection.query<ParticipantRow[]>(
        `
          SELECT *
          FROM mpj_event_participants
          WHERE ticket_code = :ticketCode OR qr_token = :ticketCode
          LIMIT 1
          FOR UPDATE
        `,
        { ticketCode },
      )
      const participantRow = rows[0]
      if (!participantRow) throw new Error('Ticket token not found')

      const participant = mapParticipant(participantRow)
      if (participant.status === 'attended' || participant.attendance_status === 'Attended') {
        return { participant, warning: 'Peserta sudah pernah check-in' }
      }
      if (participant.status !== 'confirmed' && participant.status !== 'Confirmed') {
        throw new Error('QR belum aktif. Peserta belum confirmed')
      }

      await connection.query<ResultSetHeader>(
        `
          UPDATE mpj_event_participants
          SET status = 'attended', attendance_status = 'Attended', attended_at = NOW(), checked_in_at = NOW()
          WHERE id = :participantId
        `,
        { participantId: participant.id },
      )
      await connection.query<ResultSetHeader>(
        'UPDATE mpj_event_events SET attended_count = attended_count + 1 WHERE id = :eventId',
        { eventId: participant.event_id },
      )

      const [updatedRows] = await connection.query<ParticipantRow[]>(
        'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
        { participantId: participant.id },
      )

      await connection.commit()
      return { participant: mapParticipant(updatedRows[0]) }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  })
}

export async function confirmParticipantFromPayment(payload: {
  sourceType?: string
  sourceId?: string
  paymentId?: string
  status?: string
}) {
  if (payload.sourceType !== 'event_registration') {
    throw new Error('Payment source type tidak valid untuk modul event')
  }

  const participantId = getString(payload.sourceId)
  if (!participantId) throw new Error('sourceId participant wajib diisi')

  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)

      const verified = !payload.status || ['verified', 'paid', 'success', 'confirmed'].includes(payload.status.toLowerCase())
      if (!verified) throw new Error('Status payment belum verified')

      await connection.query<ResultSetHeader>(
        `
          UPDATE mpj_event_participants
          SET status = 'confirmed', attendance_status = 'Confirmed', payment_status = 'Paid', payment_id = COALESCE(:paymentId, payment_id)
          WHERE id = :participantId
        `,
        { participantId, paymentId: getString(payload.paymentId) || null },
      )

      const [rows] = await connection.query<ParticipantRow[]>(
        'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
        { participantId },
      )
      if (!rows[0]) throw new Error('Participant tidak ditemukan')

      return mapParticipant(rows[0])
    } finally {
      connection.release()
    }
  })
}
