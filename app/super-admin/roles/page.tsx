import { AdminRegionalTable } from '@/components/rbac/AdminRegionalTable'
import { listRegionalAdmins, listRegionals } from '@/lib/server/rbac'

export default async function SuperAdminRolesPage() {
  const [admins, regionals] = await Promise.all([listRegionalAdmins(), listRegionals()])

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Role Management</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Admin Regional Management</h1>
          <p className="mt-1 text-sm text-gray-500">Tambah, edit, suspend, reset password, assign regional, dan pantau sesi admin regional.</p>
        </div>
        <AdminRegionalTable admins={admins} regionals={regionals} />
      </div>
    </main>
  )
}
