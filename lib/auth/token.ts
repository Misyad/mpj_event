import type { AuthRole } from '@/lib/auth/roles'

export type AccessTokenPayload = {
  sessionId: string
  userId: string
  role: AuthRole
  regionalId: string | null
  permissions: string[]
  exp: number
}

const encoder = new TextEncoder()

function base64UrlEncode(value: string) {
  const bytes = encoder.encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function getSigningKey() {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.ADMIN_API_TOKEN || 'mpj-event-local-auth-secret'
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function sign(data: string) {
  const signature = await crypto.subtle.sign('HMAC', await getSigningKey(), encoder.encode(data))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function createAccessToken(payload: AccessTokenPayload) {
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = await sign(body)
  return `${body}.${signature}`
}

export async function verifyAccessToken(token: string | undefined): Promise<AccessTokenPayload | null> {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  if ((await sign(body)) !== signature) return null

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AccessTokenPayload
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
