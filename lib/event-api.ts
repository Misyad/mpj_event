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
    slug: event.slug,
    category: event.category ?? 'Pelatihan',
    poster_url: event.poster_url || event.posterUrl || 'https://picsum.photos/seed/mpj-event/800/450',
    posterUrl: event.posterUrl || event.poster_url || 'https://picsum.photos/seed/mpj-event/800/450',
    description: event.description ?? '',
    location_gmaps: event.location_gmaps ?? event.locationMapsUrl ?? '',
    locationMapsUrl: event.locationMapsUrl ?? event.location_gmaps ?? '',
    location_name: event.location_name ?? event.location ?? '',
    location: event.location ?? event.location_name ?? '',
    locationType: event.locationType,
    meetingUrl: event.meetingUrl,
    start_date: event.start_date ?? event.dateStart ?? new Date().toISOString(),
    dateStart: event.dateStart ?? event.start_date ?? new Date().toISOString(),
    dateEnd: event.dateEnd,
    is_open_for_public: Boolean(event.is_open_for_public ?? event.allowPublic),
    allowPublic: Boolean(event.allowPublic ?? event.is_open_for_public),
    is_paid: Boolean(event.is_paid ?? event.isPaidEvent),
    isPaidEvent: Boolean(event.isPaidEvent ?? event.is_paid),
    price_niam: Number(event.price_niam ?? event.priceNiam ?? 0),
    priceNiam: Number(event.priceNiam ?? event.price_niam ?? 0),
    price_public: Number(event.price_public ?? event.priceUmum ?? 0),
    priceUmum: Number(event.priceUmum ?? event.price_public ?? 0),
    status: event.status ?? 'PENDING',
    scope: event.scope,
    regionId: event.regionId,
    isPublished: event.isPublished,
    isPublic: event.isPublic,
    bank_account: event.bank_account ?? DEFAULT_BANK_ACCOUNT,
    max_participants: event.max_participants ?? event.quota ?? undefined,
    quota: event.quota ?? event.max_participants ?? undefined,
    current_participants: event.current_participants ?? event.registeredCount ?? 0,
    registeredCount: event.registeredCount ?? event.current_participants ?? 0,
    attendedCount: event.attendedCount ?? 0,
    status_pendaftaran: event.status_pendaftaran ?? undefined,
    registration_deadline: event.registration_deadline ?? event.registrationDeadline,
    registrationDeadline: event.registrationDeadline ?? event.registration_deadline,
    speaker_id: event.speaker_id,
    custom_fields: event.custom_fields,
    classes: event.classes,
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
