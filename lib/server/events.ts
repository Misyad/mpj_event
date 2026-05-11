import type { RowDataPacket } from 'mysql2'
import type { CustomField, Event, EventCategory, EventStatus, RegistrationStatus } from '@/types'
import { withDb } from '@/lib/server/db'

const DEFAULT_BANK_ACCOUNT = {
  bank_name: 'BCA',
  account_number: '1234567890',
  account_name: 'MPJ Indonesia',
}

type EventRow = RowDataPacket & {
  id: string
  title: string
  category: EventCategory
  poster_path: string | null
  description: string | null
  location_gmaps: string | null
  location_name: string | null
  start_date: Date | string
  registration_deadline: Date | string | null
  is_open_for_public: 0 | 1
  is_paid: 0 | 1
  price_niam: number
  price_public: number
  status: EventStatus
  max_participants: number | null
  current_participants: number | null
  status_pendaftaran: RegistrationStatus
  speaker_id: string | null
  bank_name: string | null
  account_number: string | null
  account_name: string | null
}

type CustomFieldRow = RowDataPacket & {
  id: string
  event_id: string
  label: string
  type: CustomField['type']
  options: string | string[] | null
  is_required: 0 | 1
  order_num: number
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function parseJsonArray(value: string | string[] | null): string[] {
  if (Array.isArray(value)) return value
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function mapCustomField(row: CustomFieldRow): CustomField {
  return {
    id: row.id,
    event_id: row.event_id,
    label: row.label,
    type: row.type,
    options: parseJsonArray(row.options),
    is_required: Boolean(row.is_required),
    order: row.order_num,
  }
}

function mapEvent(row: EventRow, customFields: CustomField[] = []): Event {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    poster_url: row.poster_path || 'https://picsum.photos/seed/mpj-event/800/450',
    description: row.description ?? '',
    location_gmaps: row.location_gmaps ?? '',
    location_name: row.location_name ?? '',
    start_date: toIsoString(row.start_date),
    registration_deadline: row.registration_deadline ? toIsoString(row.registration_deadline) : undefined,
    is_open_for_public: Boolean(row.is_open_for_public),
    is_paid: Boolean(row.is_paid),
    price_niam: Number(row.price_niam ?? 0),
    price_public: Number(row.price_public ?? 0),
    status: row.status,
    bank_account: row.bank_name
      ? {
          bank_name: row.bank_name,
          account_number: row.account_number ?? '',
          account_name: row.account_name ?? '',
        }
      : DEFAULT_BANK_ACCOUNT,
    max_participants: row.max_participants ?? undefined,
    current_participants: row.current_participants ?? 0,
    status_pendaftaran: row.status_pendaftaran,
    speaker_id: row.speaker_id ?? undefined,
    custom_fields: customFields,
  }
}

const EVENT_SELECT = `
  SELECT
    e.id,
    e.title,
    e.category,
    e.poster_path,
    e.description,
    e.location_gmaps,
    e.location_name,
    e.start_date,
    e.registration_deadline,
    e.is_open_for_public,
    e.is_paid,
    e.price_niam,
    e.price_public,
    e.status,
    e.max_participants,
    e.current_participants,
    e.status_pendaftaran,
    e.speaker_id,
    ba.bank_name,
    ba.account_number,
    ba.account_name
  FROM events e
  LEFT JOIN bank_accounts ba ON ba.id = e.bank_account_id
`

async function getCustomFields(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, CustomField[]>()

  return withDb(async (db) => {
    const [rows] = await db.query<CustomFieldRow[]>(
      `
        SELECT id, event_id, label, type, options, is_required, order_num
        FROM event_custom_fields
        WHERE event_id IN (:eventIds)
        ORDER BY order_num ASC, created_at ASC
      `,
      { eventIds },
    )

    return rows.reduce((byEventId, row) => {
      const fields = byEventId.get(row.event_id) ?? []
      fields.push(mapCustomField(row))
      byEventId.set(row.event_id, fields)
      return byEventId
    }, new Map<string, CustomField[]>())
  })
}

export async function getEventsFromDb() {
  const rows = await withDb(async (db) => {
    const [events] = await db.query<EventRow[]>(`
      ${EVENT_SELECT}
      ORDER BY e.start_date ASC
    `)
    return events
  })
  const fieldsByEvent = await getCustomFields(rows.map((event) => event.id))

  return rows.map((row) => mapEvent(row, fieldsByEvent.get(row.id) ?? []))
}

export async function getEventFromDb(id: string) {
  const rows = await withDb(async (db) => {
    const [events] = await db.query<EventRow[]>(
      `
        ${EVENT_SELECT}
        WHERE e.id = :id
        LIMIT 1
      `,
      { id },
    )
    return events
  })
  const row = rows[0]
  if (!row) return null

  const fieldsByEvent = await getCustomFields([row.id])
  return mapEvent(row, fieldsByEvent.get(row.id) ?? [])
}
