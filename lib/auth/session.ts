import type { AuthRole } from '@/lib/auth/roles'
import { getAuthRoleConfig } from '@/lib/auth/roles'

export type AuthSessionPayload = {
  role: AuthRole
  email: string
  remember: boolean
  issuedAt: string
}

export function encodeAuthSession(payload: AuthSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function decodeAuthSession(token: string | undefined): AuthSessionPayload | null {
  if (!token) return null

  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as AuthSessionPayload
  } catch {
    return null
  }
}

export function getCookieNameForRole(role: AuthRole) {
  const config = getAuthRoleConfig(role)
  if (!config) throw new Error('Role tidak valid')
  return config.cookieName
}
