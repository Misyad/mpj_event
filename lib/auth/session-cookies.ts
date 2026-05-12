import type { NextResponse } from 'next/server'
import type { AuthRole } from '@/lib/auth/roles'
import { AUTH_ROUTE_CONFIGS, getAuthRouteConfig } from '@/lib/auth/role-config'

export const ACTIVE_ROLE_COOKIE = 'mpj_active_role'

type CookieResponse = NextResponse

function secureCookies() {
  return process.env.NODE_ENV === 'production'
}

function expireCookie(response: CookieResponse, name: string) {
  response.cookies.set(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: 0,
  })
}

export function clearRoleSessionCookies(response: CookieResponse, options: { exceptRole?: AuthRole; clearActiveRole?: boolean } = {}) {
  for (const roleConfig of AUTH_ROUTE_CONFIGS) {
    if (roleConfig.role === options.exceptRole) continue

    expireCookie(response, roleConfig.cookieName)
    expireCookie(response, `${roleConfig.cookieName}_refresh`)
  }

  if (options.clearActiveRole ?? true) {
    expireCookie(response, ACTIVE_ROLE_COOKIE)
  }
}

export function setActiveRoleCookie(response: CookieResponse, role: AuthRole, maxAge: number) {
  response.cookies.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: false,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge,
  })
}

export function setRoleSessionCookies(
  response: CookieResponse,
  payload: {
    role: AuthRole
    accessToken: string
    refreshToken?: string
    maxAge: number
  },
) {
  const config = getAuthRouteConfig(payload.role)
  if (!config) throw new Error('Role tidak valid')

  clearRoleSessionCookies(response, { exceptRole: payload.role, clearActiveRole: false })
  response.cookies.set(config.cookieName, payload.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: payload.maxAge,
  })

  if (payload.refreshToken) {
    response.cookies.set(`${config.cookieName}_refresh`, payload.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies(),
      path: '/',
      maxAge: payload.maxAge,
    })
  }

  setActiveRoleCookie(response, payload.role, payload.maxAge)
}
