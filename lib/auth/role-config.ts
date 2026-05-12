import type { AuthRole } from '@/lib/auth/roles'

export type AuthRouteConfig = {
  role: AuthRole
  loginPath: string
  dashboardPath: string
  cookieName: string
}

export const AUTH_ROUTE_CONFIGS: AuthRouteConfig[] = [
  {
    role: 'super-admin',
    loginPath: '/auth/super-admin-login',
    dashboardPath: '/super-admin/dashboard',
    cookieName: 'mpj_super_admin_token',
  },
  {
    role: 'regional-admin',
    loginPath: '/auth/regional-admin-login',
    dashboardPath: '/regional/dashboard',
    cookieName: 'mpj_regional_admin_token',
  },
  {
    role: 'user',
    loginPath: '/auth/user-login',
    dashboardPath: '/dashboard',
    cookieName: 'mpj_user_token',
  },
]

export function getAuthRouteConfig(role: AuthRole) {
  return AUTH_ROUTE_CONFIGS.find((config) => config.role === role)
}

export function getRequiredRoleForPath(pathname: string): AuthRole | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'super-admin'
  if (pathname.startsWith('/super-admin')) return 'super-admin'
  if (pathname.startsWith('/regional')) return 'regional-admin'
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'user'
  return null
}

export function getSafeRedirectPath(candidate: string | null | undefined, role: AuthRole) {
  const config = getAuthRouteConfig(role)
  const fallback = config?.dashboardPath ?? '/'
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return fallback

  const [pathname] = candidate.split('?')
  const requiredRole = getRequiredRoleForPath(pathname)
  if (!requiredRole || requiredRole !== role) return fallback

  return candidate
}
