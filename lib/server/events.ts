import type { RowDataPacket } from 'mysql2'
import type { Event, EventCategory, EventStatus, RegistrationStatus } from '@/types'
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
  poster_url: string | null
  description: string | null
  location_gmaps: string | null
  location_name: string | null
  start_date: Date | string
  is_open_for_public: 0 | 1
  is_paid: 0 | 1
  price_niam: number
  price_public: number
  status: EventStatus
  max_participants: number | null
  current_participants: number | null
  status_pendaftaran: RegistrationStatus | null
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    poster_url: row.poster_url || 'https://picsum.photos/seed/mpj-event/800/450',
    description: row.description ?? '',
    location_gmaps: row.location_gmaps ?? '',
    location_name: row.location_name ?? '',
    start_date: toIsoString(row.start_date),
    is_open_for_public: Boolean(row.is_open_for_public),
    is_paid: Boolean(row.is_paid),
    price_niam: Number(row.price_niam ?? 0),
    price_public: Number(row.price_public ?? 0),
    status: row.status,
    bank_account: DEFAULT_BANK_ACCOUNT,
    max_participants: row.max_participants ?? undefined,
    current_participants: row.current_participants ?? 0,
    status_pendaftaran: row.status_pendaftaran ?? 'open',
    custom_fields: [],
  }
}

export async function getEventsFromDb() {
  const rows = await withDb(async (db) => {
    const [events] = await db.query<EventRow[]>(`
      SELECT
        id,
        title,
        category,
        poster_url,
        description,
        location_gmaps,
        location_name,
        start_date,
        is_open_for_public,
        is_paid,
        price_niam,
        price_public,
        status,
        max_participants,
        current_participants,
        status_pendaftaran
      FROM mpj_event_events
      ORDER BY start_date ASC
    `)
    return events
  })

  return rows.map(mapEvent)
}

export async function getEventFromDb(id: string) {
  const rows = await withDb(async (db) => {
    const [events] = await db.query<EventRow[]>(
      `
        SELECT
          id,
          title,
          category,
          poster_url,
          description,
          location_gmaps,
          location_name,
          start_date,
          is_open_for_public,
          is_paid,
          price_niam,
          price_public,
          status,
          max_participants,
          current_participants,
          status_pendaftaran
        FROM mpj_event_events
        WHERE id = :id
        LIMIT 1
      `,
      { id },
    )
    return events
  })

  return rows[0] ? mapEvent(rows[0]) : null
}
