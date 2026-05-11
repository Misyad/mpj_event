import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLE_CONFIGS, getRequiredRoleForPath } from '@/lib/auth/roles'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requiredRole = getRequiredRoleForPath(pathname)

  if (!requiredRole) return NextResponse.next()

  const config = AUTH_ROLE_CONFIGS.find((role) => role.role === requiredRole)
  if (!config) return NextResponse.next()

  const token = request.cookies.get(config.cookieName)?.value
  if (!token) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = config.loginPath
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/super-admin/:path*', '/regional/:path*', '/dashboard/:path*'],
}
