export class MpjApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown = null,
  ) {
    super(message)
    this.name = 'MpjApiError'
  }
}

export const MPJ_API_BASE_URL = (
  process.env.MPJ_API_BASE_URL ||
  process.env.NEXT_PUBLIC_MPJ_API_BASE_URL ||
  'http://127.0.0.1:8000/api'
).replace(/\/+$/, '')

export function mpjApiUrl(path: string) {
  return `${MPJ_API_BASE_URL}/${path.replace(/^\/+/, '')}`
}

function messageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
    if (record.errors && typeof record.errors === 'object') return 'Validasi MPJ API gagal'
  }

  return fallback
}

function parseMpjApiPayload(text: string, status: number) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new MpjApiError(
      `MPJ API mengembalikan response non-JSON (${status})`,
      status,
      { raw: text, parseError: error instanceof Error ? error.message : 'Invalid JSON' },
    )
  }
}

export async function mpjApiRequest<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.token) {
    headers.set('authorization', `Bearer ${init.token}`)
  }

  if (!(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(mpjApiUrl(path), {
    ...init,
    headers,
    cache: init.cache ?? 'no-store',
  })
  const payload = parseMpjApiPayload(await response.text(), response.status)

  if (!response.ok) {
    throw new MpjApiError(messageFromPayload(payload, `MPJ API error ${response.status}`), response.status, payload)
  }

  return payload as T
}

export function unwrapMpjApiData<T>(payload: unknown, key?: string): T {
  if (payload === null || payload === undefined) {
    throw new MpjApiError('MPJ API response kosong', 502, payload)
  }

  if (key && payload && typeof payload === 'object' && key in payload) {
    return (payload as Record<string, unknown>)[key] as T
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }

  return payload as T
}
