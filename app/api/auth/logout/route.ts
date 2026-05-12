import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES, type AuthRole } from '@/lib/auth/roles'
import { getAuthRouteConfig, getRequiredRoleForPath } from '@/lib/auth/role-config'
import { ACTIVE_ROLE_COOKIE, clearRoleSessionCookies } from '@/lib/auth/session-cookies'
import { revokeCurrentSession } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getLogoutRedirectPath(request: NextRequest, role: AuthRole | null | undefined, requestedNext: string | null) {
  const fallbackRole = role ?? AUTH_ROLES.superAdmin
  const config = getAuthRouteConfig(fallbackRole)
  if (!config) return '/'

  const loginUrl = new URL(config.loginPath, request.url)
  if (requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//')) {
    const [pathname] = requestedNext.split('?')
    if (getRequiredRoleForPath(pathname) === fallbackRole) {
      loginUrl.searchParams.set('next', requestedNext)
    }
  }

  return `${loginUrl.pathname}${loginUrl.search}`
}

export async function POST(request: NextRequest) {
  const revokedSession = await revokeCurrentSession(request)
  const activeRole = request.cookies.get(ACTIVE_ROLE_COOKIE)?.value as AuthRole | undefined
  let requestedNext: string | null = null

  try {
    const payload = await request.json()
    requestedNext = typeof payload.next === 'string' ? payload.next : null
  } catch {
    requestedNext = request.nextUrl.searchParams.get('next')
  }

  const redirectTo = getLogoutRedirectPath(request, revokedSession?.role ?? activeRole, requestedNext)
  const response = NextResponse.json({ ok: true, redirectTo })
  clearRoleSessionCookies(response)

  return response
}
