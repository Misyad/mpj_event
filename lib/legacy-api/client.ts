export type LegacyApiResult<T> =
  | { ok: true; data: T; raw: unknown }
  | { ok: false; error: string; status: number; raw: unknown }

export async function legacyApiRequest<T>(path: string, init: RequestInit = {}): Promise<LegacyApiResult<T>> {
  const response = await fetch(path, {
    ...init,
    cache: init.cache ?? 'no-store',
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok || (payload && typeof payload === 'object' && 'ok' in payload && !(payload as { ok: unknown }).ok)) {
    const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
    return {
      ok: false,
      error: typeof record.error === 'string' ? record.error : typeof record.message === 'string' ? record.message : `Legacy API error ${response.status}`,
      status: response.status,
      raw: payload,
    }
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return { ok: true, data: (payload as { data: T }).data, raw: payload }
  }

  return { ok: true, data: payload as T, raw: payload }
}
