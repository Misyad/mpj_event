import { PublicUsersTable } from '@/components/rbac/PublicUsersTable'
import { listPublicUserAccounts } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

export default async function AdminPusatUsersPage() {
  const users = await listPublicUserAccounts({ limit: 150 })

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">User Account</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Akun Pengguna</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pantau akun login peserta yang dibuat dari halaman registrasi publik.
          </p>
        </div>
        <PublicUsersTable initialData={users} />
      </div>
    </main>
  )
}
