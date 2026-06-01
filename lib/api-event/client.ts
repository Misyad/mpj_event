export class ApiEventError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown = null,
  ) {
    super(message)
    this.name = 'ApiEventError'
  }
}

export const API_EVENT_BASE_URL = (
  process.env.MPJ_EVENT_API_BASE_URL ||
  process.env.MPJ_EVENT_API_URL ||
  process.env.NEXT_PUBLIC_MPJ_EVENT_API_BASE_URL ||
  'http://127.0.0.1:8098/api-event/v1'
).replace(/\/+$/, '')

export const API_EVENT_ADMIN_TOKEN = process.env.MPJ_EVENT_API_ADMIN_TOKEN || process.env.EVENT_API_TOKEN || 'mpj-event-admin-token'

export function apiEventUrl(path: string) {
  return `${API_EVENT_BASE_URL}/${path.replace(/^\/+/, '')}`
}

function messageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
    if (record.errors && typeof record.errors === 'object') return 'Validasi Laravel api-event gagal'
  }

  return fallback
}

function parseApiEventPayload(text: string, status: number) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new ApiEventError(
      `Laravel api-event mengembalikan response non-JSON (${status})`,
      status,
      { raw: text, parseError: error instanceof Error ? error.message : 'Invalid JSON' },
    )
  }
}

export async function apiEventRequest<T>(
  path: string,
  init: RequestInit & { admin?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.admin) {
    headers.set('authorization', `Bearer ${API_EVENT_ADMIN_TOKEN}`)
  }

  if (!(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(apiEventUrl(path), {
    ...init,
    headers,
    cache: init.cache ?? 'no-store',
  })
  const text = await response.text()
  const payload = parseApiEventPayload(text, response.status)

  if (!response.ok) {
    throw new ApiEventError(messageFromPayload(payload, `Laravel api-event error ${response.status}`), response.status, payload)
  }

  return payload as T
}

export function unwrapApiEventData<T>(payload: unknown): T {
  if (payload === null || payload === undefined) {
    throw new ApiEventError('Laravel api-event response kosong', 502, payload)
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data: unknown }).data
    if (data === null || data === undefined) {
      throw new ApiEventError('Laravel api-event response tidak memiliki data', 502, payload)
    }
    if (data && typeof data === 'object' && 'data' in data) {
      const nestedData = (data as { data: unknown }).data
      if (nestedData === null || nestedData === undefined) {
        throw new ApiEventError('Laravel api-event paginated response tidak memiliki data', 502, payload)
      }
      return nestedData as T
    }
    return data as T
  }

  return payload as T
}
