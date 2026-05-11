export const ADMIN_PERMISSIONS = [
  '*',
  'participants.read',
  'participants.create',
  'participants.update',
  'participants.verify',
  'events.read',
  'events.create',
  'events.update',
  'regional.manage',
  'analytics.read',
  'competition.verify',
  'competition.score',
  'settings.read',
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export const ADMIN_REGIONAL_DEFAULT_PERMISSIONS: AdminPermission[] = [
  'participants.read',
  'participants.create',
  'participants.update',
  'participants.verify',
  'events.read',
  'events.create',
  'events.update',
  'analytics.read',
  'competition.verify',
  'competition.score',
]

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  '*': 'Super access',
  'participants.read': 'Lihat peserta',
  'participants.create': 'Tambah peserta',
  'participants.update': 'Ubah peserta',
  'participants.verify': 'Verifikasi peserta',
  'events.read': 'Lihat event',
  'events.create': 'Buat event',
  'events.update': 'Ubah event',
  'regional.manage': 'Kelola regional',
  'analytics.read': 'Lihat analytics',
  'competition.verify': 'Verifikasi lomba',
  'competition.score': 'Input nilai lomba',
  'settings.read': 'Lihat pengaturan pusat',
}

export function hasPermission(permissions: string[], permission: AdminPermission) {
  return permissions.includes('*') || permissions.includes(permission)
}
