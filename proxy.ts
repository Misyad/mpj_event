import { NextRequest, NextResponse } from 'next/server'
import { getAuthRouteConfig, getRequiredRoleForPath } from '@/lib/auth/role-config'
import { verifyAccessToken } from '@/lib/auth/token'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname === '/admin' ? '/admin-pusat/dashboard' : pathname.replace(/^\/admin/, '/admin-pusat')
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === '/super-admin' || pathname.startsWith('/super-admin/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname === '/super-admin' ? '/admin-pusat/dashboard' : pathname.replace(/^\/super-admin/, '/admin-pusat')
    return NextResponse.redirect(redirectUrl)
  }

  const requiredRole = getRequiredRoleForPath(pathname)

  if (!requiredRole) return NextResponse.next()

  const config = getAuthRouteConfig(requiredRole)
  if (!config) return NextResponse.next()

  const token = await verifyAccessToken(request.cookies.get(config.cookieName)?.value)
  if (!token || token.role !== requiredRole) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = config.loginPath
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin-pusat/:path*', '/admin/:path*', '/super-admin/:path*', '/regional/:path*', '/dashboard/:path*'],
}
