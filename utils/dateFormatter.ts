export const EVENT_TIME_ZONE = 'Asia/Jakarta'
export const EVENT_TIME_ZONE_OFFSET = '+07:00'

type EventDateInput = string | Date | null | undefined

function normalizeEventDateInput(value: EventDateInput) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return new Date(`${trimmed}T00:00:00${EVENT_TIME_ZONE_OFFSET}`)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return new Date(`${trimmed}:00${EVENT_TIME_ZONE_OFFSET}`)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) return new Date(`${trimmed}${EVENT_TIME_ZONE_OFFSET}`)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const [date, time] = trimmed.split(' ')
    return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}${EVENT_TIME_ZONE_OFFSET}`)
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toEventDateTimeIso(date: string, time = '00:00') {
  const safeTime = time || '00:00'
  const normalizedTime = safeTime.length === 5 ? `${safeTime}:00` : safeTime
  return `${date}T${normalizedTime}${EVENT_TIME_ZONE_OFFSET}`
}

export function toEventDateEndIso(date: string) {
  return toEventDateTimeIso(date, '23:59:00')
}

export function getEventDateInputParts(value: EventDateInput) {
  const date = normalizeEventDateInput(value)
  if (!date) return { date: '', time: '' }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

export function getEventTimestamp(value: EventDateInput) {
  return normalizeEventDateInput(value)?.getTime() ?? 0
}

export function formatEventDate(value: EventDateInput) {
  const date = normalizeEventDateInput(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: EVENT_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatEventTime(value: EventDateInput) {
  const date = normalizeEventDateInput(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: EVENT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(':', '.')
}

export function formatEventDateTime(value: EventDateInput) {
  const date = normalizeEventDateInput(value)
  if (!date) return '-'
  return `${formatEventDate(date)}, ${formatEventTime(date)} WIB`
}

export function formatEventDateShort(value: EventDateInput) {
  const date = normalizeEventDateInput(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: EVENT_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatEventDateWithWeekday(value: EventDateInput) {
  const date = normalizeEventDateInput(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
