import { RegionalManagementClient } from '@/components/rbac/RegionalManagementClient'
import { listRegionals } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

export default async function AdminPusatRegionalPage() {
  const regionals = await listRegionals()

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Master Data</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Master Regional</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola regional MPJ untuk scope Admin Regional, event regional, dan credential regional.</p>
        </div>
        <RegionalManagementClient regionals={regionals} />
      </div>
    </main>
  )
}
