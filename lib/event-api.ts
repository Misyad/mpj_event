import { dummyEvents } from '@/lib/dummy'
import type { Event } from '@/types'

type EventApiResponse<T> = {
  ok: boolean
  data?: T
  error?: string
}

export const EVENT_API_BASE_URL =
  process.env.MPJ_EVENT_API_URL ||
  process.env.NEXT_PUBLIC_MPJ_EVENT_API_URL ||
  'https://api.projecthasan.com'

const DEFAULT_BANK_ACCOUNT = {
  bank_name: 'BCA',
  account_number: '1234567890',
  account_name: 'MPJ Indonesia',
}

export function normalizeEvent(event: Partial<Event> & { id: string; title: string }): Event {
  return {
    id: event.id,
    title: event.title,
    category: event.category ?? 'Pelatihan',
    poster_url: event.poster_url || 'https://picsum.photos/seed/mpj-event/800/450',
    description: event.description ?? '',
    location_gmaps: event.location_gmaps ?? '',
    location_name: event.location_name ?? '',
    start_date: event.start_date ?? new Date().toISOString(),
    is_open_for_public: Boolean(event.is_open_for_public),
    is_paid: Boolean(event.is_paid),
    price_niam: Number(event.price_niam ?? 0),
    price_public: Number(event.price_public ?? 0),
    status: event.status ?? 'PENDING',
    bank_account: event.bank_account ?? DEFAULT_BANK_ACCOUNT,
    max_participants: event.max_participants ?? undefined,
    current_participants: event.current_participants ?? 0,
    status_pendaftaran: event.status_pendaftaran ?? undefined,
    registration_deadline: event.registration_deadline,
    speaker_id: event.speaker_id,
    custom_fields: event.custom_fields,
  }
}

export async function fetchEventsFromApi(): Promise<Event[]> {
  const response = await fetch(`${EVENT_API_BASE_URL}/events`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  const payload = (await response.json()) as EventApiResponse<Array<Partial<Event> & { id: string; title: string }>>

  if (!payload.ok || !payload.data) {
    throw new Error(payload.error || 'Failed to fetch events')
  }

  return payload.data.map(normalizeEvent)
}

export async function getEventsWithFallback(): Promise<Event[]> {
  try {
    return await fetchEventsFromApi()
  } catch {
    return dummyEvents
  }
}
