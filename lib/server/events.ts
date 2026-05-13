import { randomUUID } from 'crypto'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { CustomField, Event, EventCategory, EventClass, EventPaymentMethod, EventScope, GatewayProvider, LocationType, Participant, PaymentRecord, RegistrationStatus } from '@/types'
import { withDb } from '@/lib/server/db'
import { createPaymenkuTransaction, normalizePaymenkuStatus, type PaymenkuWebhookPayload } from '@/lib/server/paymenku'
import { getGatewayCredentialForEvent } from '@/lib/server/payment-gateway-credentials'

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
  payment_method: EventPaymentMethod | null
  gateway_provider: GatewayProvider | null
  gateway_config: string | Event['gateway_config'] | null
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

type CustomFieldRow = RowDataPacket & {
  id: string
  event_id: string
  label: string
  type: CustomField['type']
  required: 0 | 1 | null
  is_required?: 0 | 1 | null
  options: string | string[] | null
  order_num?: number | null
}

type EventClassRow = RowDataPacket & {
  id: string
  event_id: string
  name: string
  quota: number | null
  order_num?: number | null
  registered_count?: number | null
}

type PaymentCoreStatus =
  | 'pending'
  | 'waiting_payment'
  | 'paid_unverified'
  | 'verified'
  | 'failed'
  | 'expired'
  | 'rejected'

type PaymentCoreRequest = {
  paymentId: string
  sourceType: 'event_registration'
  sourceId: string
  amount: number
  amountSnapshot: number
  paymentMethod: EventPaymentMethod
  paymentChannel: string
  gatewayProvider?: string | null
  externalRef?: string | null
  checkoutUrl?: string | null
  paymentInfo?: Record<string, unknown> | null
  status: PaymentCoreStatus
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
  final_amount?: number
  class_id?: string
  custom_responses?: Record<string, unknown>
  customAnswers?: Record<string, unknown>
}

export type RegistrationMember = {
  id: string
  niam: string
  fullName: string
  unit: string
  photoUrl: string | null
}

export type RegistrationContext = {
  userId?: string | null
  fullName?: string | null
  email?: string | null
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
  payment_method?: EventPaymentMethod
  paymentMethod?: EventPaymentMethod
  gateway_provider?: GatewayProvider | null
  gatewayProvider?: GatewayProvider | null
  gateway_config?: Event['gateway_config']
  gatewayConfig?: Event['gateway_config']
  paymenkuChannelCode?: string
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
  custom_fields?: CustomField[]
  customFields?: CustomField[]
  classes?: EventClass[]
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

function normalizePaymentMethod(value: unknown): EventPaymentMethod {
  return value === 'gateway' ? 'gateway' : 'manual'
}

function normalizeGatewayConfig(value: unknown): Event['gateway_config'] {
  const parsed = parseJson<Record<string, unknown>>(value) ?? {}
  const channelCode = getString(parsed.channelCode ?? parsed.channel_code)
  const channelName = getString(parsed.channelName ?? parsed.channel_name)
  return channelCode || channelName ? { channelCode, channelName } : null
}

function stringifyGatewayConfig(value: unknown) {
  const normalized = normalizeGatewayConfig(value)
  return normalized ? JSON.stringify(normalized) : null
}

function mapEvent(row: EventRow, customFields: CustomField[] = [], classes: EventClass[] = []): Event {
  const dateStart = toIsoString(row.start_date) ?? new Date().toISOString()
  const dateEnd = toIsoString(row.end_date)
  const registrationDeadline = toIsoString(row.registration_deadline)
  const quota = row.max_participants ?? undefined
  const registeredCount = row.current_participants ?? 0
  const attendedCount = row.attended_count ?? 0
  const status = toLegacyEventStatus(row.status)
  const v4Status = toV4EventStatus(row.status)
  const slug = row.slug || slugify(row.title)
  const paymentMethod = normalizePaymentMethod(row.payment_method)
  const gatewayConfig = normalizeGatewayConfig(row.gateway_config)

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
    payment_method: paymentMethod,
    paymentMethod,
    gateway_provider: row.gateway_provider ?? null,
    gatewayProvider: row.gateway_provider ?? null,
    gateway_config: gatewayConfig,
    gatewayConfig,
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
    custom_fields: customFields,
    classes,
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

function normalizeCustomField(row: CustomFieldRow): CustomField {
  return {
    id: row.id,
    event_id: row.event_id,
    label: row.label,
    type: row.type,
    options: parseJson<string[]>(row.options) ?? [],
    is_required: Boolean(row.required ?? row.is_required),
    order: Number(row.order_num ?? 0),
  }
}

function normalizeEventClass(row: EventClassRow): EventClass {
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    quota: row.quota,
    registeredCount: Number(row.registered_count ?? 0),
    order: Number(row.order_num ?? 0),
  }
}

async function getClassesByEventIds(connection: PoolConnection, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, EventClass[]>()

  const [rows] = await connection.query<EventClassRow[]>(
    `
      SELECT
        c.id,
        c.event_id,
        c.name,
        c.quota,
        c.order_num,
        COUNT(p.id) AS registered_count
      FROM mpj_event_classes c
      LEFT JOIN mpj_event_participants p
        ON p.class_id = c.id
        AND p.event_id = c.event_id
        AND LOWER(COALESCE(p.status, p.attendance_status, 'registered')) != 'cancelled'
      WHERE c.event_id IN (:eventIds)
      GROUP BY c.id, c.event_id, c.name, c.quota, c.order_num
      ORDER BY c.order_num ASC, c.created_at ASC
    `,
    { eventIds },
  )
  const classesByEvent = new Map<string, EventClass[]>()

  for (const row of rows) {
    const classes = classesByEvent.get(row.event_id) ?? []
    classes.push(normalizeEventClass(row))
    classesByEvent.set(row.event_id, classes)
  }

  return classesByEvent
}

function normalizeEventClassPayload(eventClass: EventClass, order: number) {
  const name = getString(eventClass.name)
  if (!name) return null

  return {
    id: getString(eventClass.id) || randomUUID(),
    name,
    quota: toNullableInteger(eventClass.quota),
    order,
  }
}

async function replaceEventClasses(connection: PoolConnection, eventId: string, classes: EventClass[] | undefined) {
  if (!classes) return

  const normalizedClasses = classes
    .map((eventClass, index) => normalizeEventClassPayload(eventClass, index))
    .filter((eventClass): eventClass is NonNullable<ReturnType<typeof normalizeEventClassPayload>> => Boolean(eventClass))

  await connection.query<ResultSetHeader>('DELETE FROM mpj_event_classes WHERE event_id = :eventId', { eventId })

  for (const eventClass of normalizedClasses) {
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO mpj_event_classes (id, event_id, name, quota, order_num)
        VALUES (:id, :eventId, :name, :quota, :order)
      `,
      {
        id: eventClass.id,
        eventId,
        name: eventClass.name,
        quota: eventClass.quota,
        order: eventClass.order,
      },
    )
  }
}

async function getCustomFieldsByEventIds(connection: PoolConnection, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, CustomField[]>()

  const [rows] = await connection.query<CustomFieldRow[]>(
    `
      SELECT id, event_id, label, type, required, options, order_num
      FROM mpj_event_custom_fields
      WHERE event_id IN (:eventIds)
      ORDER BY order_num ASC, created_at ASC
    `,
    { eventIds },
  )
  const fieldsByEvent = new Map<string, CustomField[]>()

  for (const row of rows) {
    const fields = fieldsByEvent.get(row.event_id) ?? []
    fields.push(normalizeCustomField(row))
    fieldsByEvent.set(row.event_id, fields)
  }

  return fieldsByEvent
}

function normalizeCustomFieldPayload(field: CustomField, order: number) {
  const label = getString(field.label)
  if (!label) return null

  const type = field.type
  const options = Array.isArray(field.options) ? field.options.map(getString).filter(Boolean) : []
  if (['radio', 'dropdown', 'checkbox'].includes(type) && options.length === 0) {
    throw new Error(`Opsi wajib diisi untuk pertanyaan "${label}"`)
  }

  return {
    id: getString(field.id) || randomUUID(),
    label,
    type,
    options,
    required: field.is_required ? 1 : 0,
    order,
  }
}

async function replaceEventCustomFields(connection: PoolConnection, eventId: string, fields: CustomField[] | undefined) {
  if (!fields) return

  const normalizedFields = fields
    .map((field, index) => normalizeCustomFieldPayload(field, index))
    .filter((field): field is NonNullable<ReturnType<typeof normalizeCustomFieldPayload>> => Boolean(field))

  await connection.query<ResultSetHeader>('DELETE FROM mpj_event_custom_fields WHERE event_id = :eventId', { eventId })

  for (const field of normalizedFields) {
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO mpj_event_custom_fields (id, event_id, label, type, required, options, order_num)
        VALUES (:id, :eventId, :label, :type, :required, CAST(:options AS JSON), :order)
      `,
      {
        id: field.id,
        eventId,
        label: field.label,
        type: field.type,
        required: field.required,
        options: JSON.stringify(field.options),
        order: field.order,
      },
    )
  }
}

async function validateCustomResponses(connection: PoolConnection, eventId: string, responses: Record<string, unknown>) {
  const fields = (await getCustomFieldsByEventIds(connection, [eventId])).get(eventId) ?? []

  for (const field of fields) {
    const response = responses[field.id]
    const empty = response === undefined || response === null || response === '' || (Array.isArray(response) && response.length === 0)

    if (field.is_required && empty) {
      throw new Error(`Pertanyaan "${field.label}" wajib diisi`)
    }

    if (empty) continue

    if (field.type === 'checkbox') {
      if (!Array.isArray(response) || response.some((value) => !field.options.includes(String(value)))) {
        throw new Error(`Jawaban "${field.label}" tidak valid`)
      }
      continue
    }

    if (['radio', 'dropdown'].includes(field.type) && !field.options.includes(String(response))) {
      throw new Error(`Jawaban "${field.label}" tidak valid`)
    }
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
    classId: row.class_id,
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

async function resolveRegistrationClassId(connection: PoolConnection, eventId: string, classId: string) {
  const [classRows] = await connection.query<EventClassRow[]>(
    `
      SELECT id, event_id, name, quota
      FROM mpj_event_classes
      WHERE event_id = :eventId
      ORDER BY order_num ASC, created_at ASC
      FOR UPDATE
    `,
    { eventId },
  )

  if (classRows.length === 0) return null
  if (!classId) throw new Error('Kelas wajib dipilih')

  const selectedClass = classRows.find((row) => row.id === classId)
  if (!selectedClass) throw new Error('Kelas tidak valid untuk event ini')

  if (selectedClass.quota !== null) {
    const [countRows] = await connection.query<RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM mpj_event_participants
        WHERE event_id = :eventId
          AND class_id = :classId
          AND LOWER(COALESCE(status, attendance_status, 'registered')) != 'cancelled'
      `,
      { eventId, classId },
    )
    if (Number(countRows[0]?.total || 0) >= Number(selectedClass.quota)) {
      throw new Error(`Kuota kelas "${selectedClass.name}" sudah penuh`)
    }
  }

  return selectedClass.id
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
  await connection.query(`
    CREATE TABLE IF NOT EXISTS crew_members (
      id VARCHAR(36) NOT NULL,
      niam VARCHAR(50) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      unit VARCHAR(255) NULL,
      photo_path VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crew_members_niam_unique (niam)
    )
  `)

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
  await ensureColumn(connection, 'mpj_event_events', 'payment_method', "VARCHAR(50) NOT NULL DEFAULT 'manual'")
  await ensureColumn(connection, 'mpj_event_events', 'gateway_provider', 'VARCHAR(50) NULL')
  await ensureColumn(connection, 'mpj_event_events', 'gateway_config', 'JSON NULL')

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
      order_num INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY mpj_event_classes_event_id_idx (event_id)
    )
  `)
  await ensureColumn(connection, 'mpj_event_classes', 'order_num', 'INT NOT NULL DEFAULT 0')

  await connection.query(`
    CREATE TABLE IF NOT EXISTS mpj_event_custom_fields (
      id VARCHAR(36) NOT NULL,
      event_id VARCHAR(36) NOT NULL,
      label VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      required TINYINT(1) NOT NULL DEFAULT 0,
      options JSON NULL,
      order_num INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY mpj_event_custom_fields_event_id_idx (event_id)
    )
  `)
  await ensureColumn(connection, 'mpj_event_custom_fields', 'required', 'TINYINT(1) NOT NULL DEFAULT 0')
  await ensureColumn(connection, 'mpj_event_custom_fields', 'options', 'JSON NULL')
  await ensureColumn(connection, 'mpj_event_custom_fields', 'order_num', 'INT NOT NULL DEFAULT 0')

  await connection.query(`
    CREATE TABLE IF NOT EXISTS mpj_payment_core_payments (
      id VARCHAR(36) NOT NULL,
      source_type VARCHAR(100) NOT NULL,
      source_id VARCHAR(36) NOT NULL,
      amount_snapshot INT UNSIGNED NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'manual',
      payment_channel VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
      external_ref VARCHAR(120) NULL,
      checkout_url VARCHAR(700) NULL,
      payment_info JSON NULL,
      external_status VARCHAR(50) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'waiting_payment',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      paid_at DATETIME NULL,
      expires_at DATETIME NULL,
      verified_at DATETIME NULL,
      PRIMARY KEY (id),
      UNIQUE KEY mpj_payment_core_source_key (source_type, source_id),
      KEY mpj_payment_core_status_idx (status)
    )
  `)
  await ensureColumn(connection, 'mpj_payment_core_payments', 'checkout_url', 'VARCHAR(700) NULL')
  await ensureColumn(connection, 'mpj_payment_core_payments', 'payment_info', 'JSON NULL')
  await ensureColumn(connection, 'mpj_payment_core_payments', 'external_status', 'VARCHAR(50) NULL')
  await ensureColumn(connection, 'mpj_payment_core_payments', 'expires_at', 'DATETIME NULL')

  await connection.query(`
    CREATE TABLE IF NOT EXISTS mpj_payment_core_audit_logs (
      id VARCHAR(36) NOT NULL,
      payment_id VARCHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY mpj_payment_core_audit_payment_idx (payment_id)
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

function mapRegistrationMember(row: RowDataPacket): RegistrationMember {
  return {
    id: String(row.id),
    niam: String(row.niam),
    fullName: String(row.full_name),
    unit: row.unit ? String(row.unit) : '',
    photoUrl: row.photo_path ? String(row.photo_path) : null,
  }
}

async function findRegistrationMemberByNiam(connection: PoolConnection, value: string) {
  const niam = getString(value).toUpperCase()
  if (!niam) return null

  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT id, niam, full_name, unit, photo_path
      FROM crew_members
      WHERE UPPER(niam) = :niam
      LIMIT 1
    `,
    { niam },
  )

  return rows[0] ? mapRegistrationMember(rows[0]) : null
}

export async function getRegistrationMemberByNiam(value: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureEventV4Schema(connection)
      return await findRegistrationMemberByNiam(connection, value)
    } finally {
      connection.release()
    }
  })
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
    payment_method,
    gateway_provider,
    gateway_config,
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
      const eventIds = rows.map((row) => row.id)
      const fieldsByEvent = await getCustomFieldsByEventIds(connection, eventIds)
      const classesByEvent = await getClassesByEventIds(connection, eventIds)
      const events = rows.map((row) => mapEvent(row, fieldsByEvent.get(row.id) ?? [], classesByEvent.get(row.id) ?? []))
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
      const eventIds = rows.map((row) => row.id)
      const fieldsByEvent = await getCustomFieldsByEventIds(connection, eventIds)
      const classesByEvent = await getClassesByEventIds(connection, eventIds)
      const event = rows[0] ? mapEvent(rows[0], fieldsByEvent.get(rows[0].id) ?? [], classesByEvent.get(rows[0].id) ?? []) : null
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

export async function getCertificateByTicketCode(ticketCode: string) {
  const participant = await getParticipantByTicketCode(ticketCode)
  if (!participant) return null

  const event = await getEventFromDb(participant.event_id)
  if (!event) return null

  const participantStatus = String(participant.status || participant.attendance_status).toLowerCase()
  const eventStatus = String(event.status).toLowerCase()
  const hasAttended = participantStatus === 'attended'
  const eventCompleted = eventStatus === 'finished' || eventStatus === 'completed'
  const certificateNumber = `MPJ-CERT-${event.id.slice(0, 8).toUpperCase()}-${participant.id.slice(0, 8).toUpperCase()}`

  return {
    participant,
    event,
    certificateNumber,
    issuedAt: new Date().toISOString(),
    eligible: hasAttended && eventCompleted,
    reason: !hasAttended
      ? 'Sertifikat belum tersedia karena peserta belum check-in.'
      : !eventCompleted
        ? 'Sertifikat tersedia setelah event selesai.'
        : null,
  }
}

export async function getParticipantsByEventFromDb(eventIdentifier: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      const event = await getEventFromDb(eventIdentifier)
      if (!event) return []

      const [rows] = await connection.query<ParticipantRow[]>(
        `
          SELECT *
          FROM mpj_event_participants
          WHERE event_id = :eventId
          ORDER BY created_at DESC
        `,
        { eventId: event.id },
      )
      return rows.map(mapParticipant)
    } finally {
      connection.release()
    }
  })
}

export async function getPaymentRecordsByEventFromDb(eventIdentifier: string): Promise<PaymentRecord[]> {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      const event = await getEventFromDb(eventIdentifier)
      if (!event) return []

      const [rows] = await connection.query<Array<RowDataPacket & {
        id: string | null
        participant_id: string
        participant_name: string | null
        registration_path: string
        amount_snapshot: number | null
        participant_payment_status: string
        payment_status: string | null
        payment_method: string | null
        payment_channel: string | null
        external_ref: string | null
        checkout_url: string | null
        external_status: string | null
        submitted_at: Date | string | null
        verified_at: Date | string | null
      }>>(
        `
          SELECT
            COALESCE(pc.id, p.payment_id, p.id) AS id,
            p.id AS participant_id,
            COALESCE(p.full_name, JSON_UNQUOTE(JSON_EXTRACT(p.crew_json, '$.full_name')), JSON_UNQUOTE(JSON_EXTRACT(p.guest_json, '$.full_name'))) AS participant_name,
            p.registration_path,
            pc.amount_snapshot,
            p.payment_status AS participant_payment_status,
            pc.status AS payment_status,
            pc.payment_method,
            pc.payment_channel,
            pc.external_ref,
            pc.checkout_url,
            pc.external_status,
            pc.created_at AS submitted_at,
            pc.verified_at
          FROM mpj_event_participants p
          LEFT JOIN mpj_payment_core_payments pc
            ON pc.source_type = 'event_registration' AND pc.source_id = p.id
          WHERE p.event_id = :eventId
            AND (p.payment_id IS NOT NULL OR p.payment_status <> 'Free')
          ORDER BY COALESCE(pc.created_at, p.created_at) DESC
        `,
        { eventId: event.id },
      )

      return rows.map((row) => ({
        id: String(row.id || row.participant_id),
        event_id: event.id,
        participant_id: row.participant_id,
        participant_name: String(row.participant_name || '-'),
        path: row.registration_path === 'NIAM' ? 'NIAM' : 'UMUM',
        amount: Number(row.amount_snapshot || 0),
        status: row.participant_payment_status as PaymentRecord['status'],
        submitted_at: toIsoString(row.submitted_at) ?? null,
        verified_at: toIsoString(row.verified_at) ?? null,
        provider: row.payment_method === 'gateway' ? 'paymenku' : 'manual',
        channel: row.payment_channel,
        externalRef: row.external_ref,
        checkoutUrl: row.checkout_url,
        externalStatus: row.external_status,
      }))
    } finally {
      connection.release()
    }
  })
}

export async function getAdminParticipantsFromDb(options: { scope?: EventScope; regionId?: string | null } = {}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      const where: string[] = []
      const values: Record<string, unknown> = {}

      if (options.scope === 'regional') {
        where.push('e.scope = :scope')
        where.push('e.region_id = :regionId')
        values.scope = 'regional'
        values.regionId = options.regionId ?? ''
      }

      const [rows] = await connection.query<Array<ParticipantRow & {
        event_title: string
        event_slug: string | null
        event_status: string
        event_scope: EventScope | null
        event_region_id: string | null
        event_start_date: Date | string
        event_location_name: string
        payment_amount: number | null
      }>>(
        `
          SELECT
            p.*,
            e.title AS event_title,
            e.slug AS event_slug,
            e.status AS event_status,
            e.scope AS event_scope,
            e.region_id AS event_region_id,
            e.start_date AS event_start_date,
            e.location_name AS event_location_name,
            pc.amount_snapshot AS payment_amount
          FROM mpj_event_participants p
          INNER JOIN mpj_event_events e ON e.id = p.event_id
          LEFT JOIN mpj_payment_core_payments pc
            ON pc.source_type = 'event_registration' AND pc.source_id = p.id
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY p.created_at DESC
        `,
        values as never,
      )

      return rows.map((row) => {
        const participant = mapParticipant(row)
        return {
          ...participant,
          unique_amount: Number(row.payment_amount || 0),
          event: {
            id: participant.event_id,
            title: row.event_title,
            slug: row.event_slug ?? undefined,
            status: row.event_status,
            scope: row.event_scope ?? undefined,
            regionId: row.event_region_id,
            start_date: toIsoString(row.event_start_date) ?? '',
            location_name: row.event_location_name,
          },
        }
      })
    } finally {
      connection.release()
    }
  })
}

export async function confirmParticipantManually(eventIdentifier: string, participantId: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      await connection.beginTransaction()

      const [eventRows] = await connection.query<EventRow[]>(
        `${EVENT_SELECT} WHERE id = :eventIdentifier OR slug = :eventIdentifier LIMIT 1`,
        { eventIdentifier },
      )
      const event = eventRows[0]
      if (!event) throw new Error('Event tidak ditemukan')

      const [participantRows] = await connection.query<ParticipantRow[]>(
        `
          SELECT *
          FROM mpj_event_participants
          WHERE id = :participantId AND event_id = :eventId
          LIMIT 1
          FOR UPDATE
        `,
        { participantId, eventId: event.id },
      )
      const participant = participantRows[0]
      if (!participant) throw new Error('Participant tidak ditemukan')
      if (String(participant.status || '').toLowerCase() === 'attended') throw new Error('Peserta sudah check-in')

      const [paymentRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id
          FROM mpj_payment_core_payments
          WHERE source_type = 'event_registration' AND source_id = :participantId
          LIMIT 1
          FOR UPDATE
        `,
        { participantId },
      )
      const paymentId = String(paymentRows[0]?.id || participant.payment_id || '')

      if (paymentId) {
        await connection.query<ResultSetHeader>(
          `
            UPDATE mpj_payment_core_payments
            SET status = 'verified', verified_at = COALESCE(verified_at, NOW())
            WHERE id = :paymentId
          `,
          { paymentId },
        )
        await appendPaymentCoreAudit(connection, paymentId, 'payment_verified_manual', {
          sourceType: 'event_registration',
          sourceId: participantId,
        })
      }

      await connection.query<ResultSetHeader>(
        `
          UPDATE mpj_event_participants
          SET status = 'confirmed',
              attendance_status = 'Confirmed',
              payment_status = :paymentStatus,
              payment_id = COALESCE(:paymentId, payment_id)
          WHERE id = :participantId
        `,
        {
          participantId,
          paymentId: paymentId || null,
          paymentStatus: Number(event.is_paid) ? 'Paid' : 'Free',
        },
      )

      const [updatedRows] = await connection.query<ParticipantRow[]>(
        'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
        { participantId },
      )

      if (paymentId) {
        const { syncPaymentFinanceTransaction } = await import('@/lib/server/finance')
        await syncPaymentFinanceTransaction(connection, paymentId)
      }

      await connection.commit()
      return mapParticipant(updatedRows[0])
    } catch (error) {
      await connection.rollback()
      throw error
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
      const paymentMethod = normalizePaymentMethod(payload.paymentMethod ?? payload.payment_method)
      const gatewayProvider = paymentMethod === 'gateway' ? getString(payload.gatewayProvider ?? payload.gateway_provider) || 'paymenku' : null
      const gatewayConfig = paymentMethod === 'gateway'
        ? stringifyGatewayConfig(payload.gatewayConfig ?? payload.gateway_config ?? { channelCode: payload.paymenkuChannelCode })
        : null

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO mpj_event_events (
            id, title, slug, category, poster_url, description, location_gmaps,
            location_name, location_type, meeting_url, start_date, end_date,
            is_open_for_public, is_paid, payment_method, gateway_provider, gateway_config,
            price_niam, price_public, status,
            scope, region_id, is_published, is_public, max_participants,
            current_participants, attended_count, status_pendaftaran, registration_deadline
          ) VALUES (
            :id, :title, :slug, :category, :posterUrl, :description, :locationMapsUrl,
            :locationName, :locationType, :meetingUrl, :startDate, :endDate,
            :allowPublic, :isPaid, :paymentMethod, :gatewayProvider, CAST(:gatewayConfig AS JSON),
            :priceNiam, :priceUmum, :status,
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
          paymentMethod,
          gatewayProvider,
          gatewayConfig,
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
      await replaceEventCustomFields(connection, id, payload.custom_fields ?? payload.customFields)
      await replaceEventClasses(connection, id, payload.classes)

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
      if (payload.payment_method !== undefined || payload.paymentMethod !== undefined) {
        const paymentMethod = normalizePaymentMethod(payload.paymentMethod ?? payload.payment_method)
        setField('payment_method', 'paymentMethod', paymentMethod)
        setField('gateway_provider', 'gatewayProviderFromMethod', paymentMethod === 'gateway' ? 'paymenku' : null)
        if (paymentMethod === 'manual') setField('gateway_config', 'gatewayConfigFromMethod', null)
      }
      if (payload.gateway_provider !== undefined || payload.gatewayProvider !== undefined) {
        setField('gateway_provider', 'gatewayProvider', getString(payload.gatewayProvider ?? payload.gateway_provider) || null)
      }
      if (payload.gateway_config !== undefined || payload.gatewayConfig !== undefined || payload.paymenkuChannelCode !== undefined) {
        setField('gateway_config', 'gatewayConfig', stringifyGatewayConfig(payload.gatewayConfig ?? payload.gateway_config ?? { channelCode: payload.paymenkuChannelCode }))
      }
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
      await replaceEventCustomFields(connection, existing.id, payload.custom_fields ?? payload.customFields)
      await replaceEventClasses(connection, existing.id, payload.classes)

      return getEventFromDb(existing.id)
    } finally {
      connection.release()
    }
  })
}

async function appendPaymentCoreAudit(
  connection: PoolConnection,
  paymentId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  await connection.query<ResultSetHeader>(
    `
      INSERT INTO mpj_payment_core_audit_logs (id, payment_id, action, metadata)
      VALUES (:id, :paymentId, :action, CAST(:metadata AS JSON))
    `,
    {
      id: randomUUID(),
      paymentId,
      action,
      metadata: JSON.stringify(metadata),
    },
  )
}

async function createPaymentCoreRequest(
  connection: PoolConnection,
  participantId: string,
  amount: number,
  options: {
    event?: Event
    customerName?: string
    customerEmail?: string
    customerPhone?: string
  } = {},
): Promise<PaymentCoreRequest> {
  const paymentId = randomUUID()
  const event = options.event
  const paymentMethod = event?.payment_method === 'gateway' ? 'gateway' : 'manual'
  const channelCode = paymentMethod === 'gateway'
    ? getString(event?.gateway_config?.channelCode)
    : 'bank_transfer'

  if (paymentMethod === 'gateway' && !channelCode) {
    throw new Error('Channel Paymenku belum dipilih untuk event ini')
  }

  const paymentRequest: PaymentCoreRequest = {
    paymentId,
    sourceType: 'event_registration',
    sourceId: participantId,
    amount,
    amountSnapshot: amount,
    paymentMethod,
    paymentChannel: channelCode,
    gatewayProvider: paymentMethod === 'gateway' ? 'paymenku' : null,
    status: 'waiting_payment',
  }

  if (paymentMethod === 'gateway') {
    const credential = await getGatewayCredentialForEvent(event as Event)
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/+$/, '')
    const payment = await createPaymenkuTransaction({
      referenceId: paymentId,
      amount,
      customerName: options.customerName || 'Peserta MPJ',
      customerEmail: options.customerEmail || 'no-reply@mpj-event.local',
      customerPhone: options.customerPhone,
      channelCode,
      returnUrl: appUrl ? `${appUrl}/ticket?paymentId=${encodeURIComponent(paymentId)}` : `${process.env.NEXT_PUBLIC_MPJ_EVENT_URL || ''}/ticket?paymentId=${encodeURIComponent(paymentId)}`,
    }, credential)

    paymentRequest.externalRef = payment.trxId
    paymentRequest.checkoutUrl = payment.payUrl
    paymentRequest.paymentInfo = payment.paymentInfo
    paymentRequest.status = normalizePaymenkuStatus(payment.status) as PaymentCoreStatus
  }

  await connection.query<ResultSetHeader>(
    `
      INSERT INTO mpj_payment_core_payments (
        id, source_type, source_id, amount_snapshot, payment_method,
        payment_channel, external_ref, checkout_url, payment_info, external_status, status, expires_at
      ) VALUES (
        :paymentId, :sourceType, :sourceId, :amount, :paymentMethod,
        :paymentChannel, :externalRef, :checkoutUrl, CAST(:paymentInfo AS JSON), :externalStatus, :status, :expiresAt
      )
    `,
    {
      paymentId,
      sourceType: paymentRequest.sourceType,
      sourceId: participantId,
      amount,
      paymentMethod: paymentRequest.paymentMethod,
      paymentChannel: paymentRequest.paymentChannel,
      externalRef: paymentRequest.externalRef ?? null,
      checkoutUrl: paymentRequest.checkoutUrl ?? null,
      paymentInfo: paymentRequest.paymentInfo ? JSON.stringify(paymentRequest.paymentInfo) : null,
      externalStatus: paymentRequest.status,
      status: paymentRequest.status,
      expiresAt: toNullableDate(paymentRequest.paymentInfo?.expiration_date),
    },
  )

  await appendPaymentCoreAudit(connection, paymentId, 'payment_created', {
    sourceType: paymentRequest.sourceType,
    sourceId: participantId,
    amount,
    paymentMethod: paymentRequest.paymentMethod,
    paymentChannel: paymentRequest.paymentChannel,
    gatewayProvider: paymentRequest.gatewayProvider,
    externalRef: paymentRequest.externalRef,
  })

  return paymentRequest
}

export async function registerEventParticipant(eventIdentifier: string, payload: RegisterPayload, context: RegistrationContext = {}) {
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

      const whatsapp = getString(payload.whatsapp)
      const email = getString(context.email || payload.email)
      const member = await findRegistrationMemberByNiam(connection, getString(payload.niam))
      const registrationPath = member ? 'NIAM' : 'UMUM'
      if (registrationPath === 'UMUM' && !event.allowPublic) throw new Error('Event ini tidak membuka jalur umum')

      const fullName = member?.fullName || getString(context.fullName || payload.full_name || payload.name)
      if (!fullName) throw new Error('Nama lengkap wajib diisi')

      const institution = member?.unit || getString(payload.institution_name || payload.institution)
      const niam = member?.niam ?? ''
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
      const requestedAmount = Number(payload.final_amount ?? 0)
      const usesGateway = event.payment_method === 'gateway'
      const paymentAmount =
        usesGateway
          ? baseAmount
          : event.isPaidEvent && requestedAmount >= baseAmount && requestedAmount <= baseAmount + 999
          ? requestedAmount
          : baseAmount
      const participantStatus = event.isPaidEvent ? 'registered' : 'confirmed'
      const paymentStatus = event.isPaidEvent ? 'Unpaid' : 'Free'
      const customAnswers = payload.customAnswers ?? payload.custom_responses ?? {}
      await validateCustomResponses(connection, event.id, customAnswers)
      const classId = await resolveRegistrationClassId(connection, event.id, getString(payload.class_id))
      const crew =
        registrationPath === 'NIAM'
          ? {
              niam,
              full_name: fullName,
              unit: member?.unit || getString(payload.unit),
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
            :fullName, :institution, :whatsapp, :userId, :niam, :email,
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
          userId: context.userId || null,
          niam: niam || null,
          email: email || null,
          classId,
          participantStatus,
          paymentId: null,
          customAnswers: JSON.stringify(customAnswers),
        },
      )

      const paymentRequest = event.isPaidEvent
        ? await createPaymentCoreRequest(connection, participantId, paymentAmount, {
            event,
            customerName: fullName,
            customerEmail: email,
            customerPhone: whatsapp,
          })
        : null

      if (paymentRequest) {
        await connection.query<ResultSetHeader>(
          'UPDATE mpj_event_participants SET payment_id = :paymentId WHERE id = :participantId',
          { participantId, paymentId: paymentRequest.paymentId },
        )
      }

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

  const sourceId = getString(payload.sourceId)
  const paymentId = getString(payload.paymentId)
  if (!sourceId && !paymentId) throw new Error('sourceId atau paymentId wajib diisi')

  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      await connection.beginTransaction()

      const verified = !payload.status || ['verified', 'paid', 'success', 'confirmed'].includes(payload.status.toLowerCase())
      if (!verified) throw new Error('Status payment belum verified')

      const [paymentRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id, source_id
          FROM mpj_payment_core_payments
          WHERE (:paymentId = '' OR id = :paymentId)
            AND (:sourceId = '' OR source_id = :sourceId)
            AND source_type = 'event_registration'
          LIMIT 1
          FOR UPDATE
        `,
        { paymentId, sourceId },
      )
      const paymentRow = paymentRows[0]
      if (paymentId && !paymentRow) throw new Error('Payment Core record tidak ditemukan')

      const participantId = sourceId || String(paymentRow?.source_id || '')
      if (!participantId) throw new Error('Payment Core record tidak ditemukan')

      if (paymentRow?.id) {
        await connection.query<ResultSetHeader>(
          `
            UPDATE mpj_payment_core_payments
            SET status = 'verified', verified_at = COALESCE(verified_at, NOW())
            WHERE id = :paymentId
          `,
          { paymentId: paymentRow.id },
        )

        await appendPaymentCoreAudit(connection, String(paymentRow.id), 'payment_verified', {
          sourceType: payload.sourceType,
          sourceId: participantId,
          status: payload.status ?? 'verified',
        })

        const { syncPaymentFinanceTransaction } = await import('@/lib/server/finance')
        await syncPaymentFinanceTransaction(connection, String(paymentRow.id))
      }

      await connection.query<ResultSetHeader>(
        `
          UPDATE mpj_event_participants
          SET status = 'confirmed', attendance_status = 'Confirmed', payment_status = 'Paid', payment_id = COALESCE(:paymentId, payment_id)
          WHERE id = :participantId
        `,
        { participantId, paymentId: paymentRow?.id ?? (paymentId || null) },
      )

      const [rows] = await connection.query<ParticipantRow[]>(
        'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
        { participantId },
      )
      if (!rows[0]) throw new Error('Participant tidak ditemukan')

      await connection.commit()
      return mapParticipant(rows[0])
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  })
}

export async function applyPaymenkuPaymentUpdate(payload: PaymenkuWebhookPayload) {
  const paymentId = getString(payload.reference_id)
  const externalRef = getString(payload.trx_id)
  if (!paymentId && !externalRef) throw new Error('reference_id atau trx_id wajib diisi')

  const normalizedStatus = normalizePaymenkuStatus(payload.status) as PaymentCoreStatus
  const verified = normalizedStatus === 'verified'
  const paidAt = toNullableDate(payload.paid_at)

  return withDb(async (db) => {
    const connection = await db.getConnection()

    try {
      await ensureEventV4Schema(connection)
      await connection.beginTransaction()

      const [paymentRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id, source_id
          FROM mpj_payment_core_payments
          WHERE (:paymentId <> '' AND id = :paymentId)
            OR (:externalRef <> '' AND external_ref = :externalRef)
          LIMIT 1
          FOR UPDATE
        `,
        { paymentId, externalRef },
      )
      const paymentRow = paymentRows[0]
      if (!paymentRow) throw new Error('Payment Core record tidak ditemukan')

      await connection.query<ResultSetHeader>(
        `
          UPDATE mpj_payment_core_payments
          SET
            external_ref = COALESCE(NULLIF(:externalRef, ''), external_ref),
            external_status = :externalStatus,
            status = :status,
            paid_at = CASE WHEN :verified = 1 THEN COALESCE(:paidAt, paid_at, NOW()) ELSE paid_at END,
            verified_at = CASE WHEN :verified = 1 THEN COALESCE(verified_at, NOW()) ELSE verified_at END,
            payment_info = CAST(:paymentInfo AS JSON)
          WHERE id = :paymentId
        `,
        {
          paymentId: paymentRow.id,
          externalRef,
          externalStatus: payload.status ?? null,
          status: normalizedStatus,
          verified: verified ? 1 : 0,
          paidAt,
          paymentInfo: JSON.stringify(payload),
        },
      )

      await appendPaymentCoreAudit(connection, String(paymentRow.id), 'paymenku_webhook_received', {
        event: payload.event,
        status: payload.status,
        normalizedStatus,
        trxId: externalRef,
      })

      if (verified) {
        await connection.query<ResultSetHeader>(
          `
            UPDATE mpj_event_participants
            SET status = 'confirmed', attendance_status = 'Confirmed', payment_status = 'Paid', payment_id = :paymentId
            WHERE id = :participantId
          `,
          { participantId: paymentRow.source_id, paymentId: paymentRow.id },
        )
        const { syncPaymentFinanceTransaction } = await import('@/lib/server/finance')
        await syncPaymentFinanceTransaction(connection, String(paymentRow.id))
      }

      const [rows] = await connection.query<ParticipantRow[]>(
        'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
        { participantId: paymentRow.source_id },
      )
      if (!rows[0]) throw new Error('Participant tidak ditemukan')

      await connection.commit()
      return mapParticipant(rows[0])
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  })
}
