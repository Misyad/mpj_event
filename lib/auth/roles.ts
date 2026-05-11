import { Building2, Crown, UserRound } from 'lucide-react'

export const AUTH_ROLES = {
  superAdmin: 'super-admin',
  regionalAdmin: 'regional-admin',
  user: 'user',
} as const

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES]

export type AuthRoleConfig = {
  role: AuthRole
  title: string
  shortTitle: string
  description: string
  loginPath: string
  dashboardPath: string
  cookieName: string
  badge?: string
  icon: typeof Crown
  accentClassName: string
  permissions: string[]
}

export const AUTH_ROLE_CONFIGS: AuthRoleConfig[] = [
  {
    role: AUTH_ROLES.superAdmin,
    title: 'Super Admin',
    shortTitle: 'Admin Pusat',
    description: 'Full access untuk seluruh sistem, approval, analytics global, dan master settings.',
    loginPath: '/auth/super-admin-login',
    dashboardPath: '/super-admin/dashboard',
    cookieName: 'mpj_super_admin_token',
    badge: 'Full Access',
    icon: Crown,
    accentClassName: 'border-[#C9A227]/40 bg-[#fff8e1] text-[#1B4332]',
    permissions: ['Full access seluruh sistem', 'Manage regional', 'Approval system', 'Analytics global'],
  },
  {
    role: AUTH_ROLES.regionalAdmin,
    title: 'Admin Regional',
    shortTitle: 'Regional',
    description: 'Kelola wilayah, peserta regional, monitoring event daerah, dan verifikasi lomba.',
    loginPath: '/auth/regional-admin-login',
    dashboardPath: '/regional/dashboard',
    cookieName: 'mpj_regional_admin_token',
    badge: 'Regional Access',
    icon: Building2,
    accentClassName: 'border-emerald-200 bg-emerald-50 text-[#1B4332]',
    permissions: ['Manage wilayah', 'Manage peserta regional', 'Monitoring event daerah', 'Verifikasi lomba'],
  },
  {
    role: AUTH_ROLES.user,
    title: 'User / Peserta',
    shortTitle: 'Peserta',
    description: 'Daftar lomba, lihat jadwal, upload berkas, lihat hasil, dan kelola profil.',
    loginPath: '/auth/user-login',
    dashboardPath: '/dashboard',
    cookieName: 'mpj_user_token',
    badge: 'Participant',
    icon: UserRound,
    accentClassName: 'border-blue-200 bg-blue-50 text-[#1B4332]',
    permissions: ['Daftar lomba', 'Lihat jadwal', 'Upload berkas', 'Profile peserta'],
  },
]

export function getAuthRoleConfig(role: AuthRole) {
  return AUTH_ROLE_CONFIGS.find((config) => config.role === role)
}

export function getAuthRoleByLoginPath(pathname: string) {
  return AUTH_ROLE_CONFIGS.find((config) => config.loginPath === pathname)?.role
}

export function getRequiredRoleForPath(pathname: string): AuthRole | null {
  if (pathname.startsWith('/super-admin')) return AUTH_ROLES.superAdmin
  if (pathname.startsWith('/regional')) return AUTH_ROLES.regionalAdmin
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return AUTH_ROLES.user
  return null
}
