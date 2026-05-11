import { PermissionMatrix } from '@/components/rbac/PermissionMatrix'
import { ADMIN_PERMISSIONS, PERMISSION_LABELS } from '@/lib/auth/permissions'
import { listRolesWithPermissions } from '@/lib/server/rbac'

export default async function SuperAdminPermissionsPage() {
  const roles = await listRolesWithPermissions()
  const permissions = ADMIN_PERMISSIONS.map((code) => ({
    code,
    label: PERMISSION_LABELS[code],
    module: code === '*' ? 'system' : code.split('.')[0],
  }))

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Permission Management</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Dynamic Permission Matrix</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola permission modular untuk sidebar, route guard, API guard, dan regional scope.</p>
        </div>
        <PermissionMatrix permissions={permissions} roles={roles} />
      </div>
    </main>
  )
}
