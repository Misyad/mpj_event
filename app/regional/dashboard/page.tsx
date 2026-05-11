import { Building2, CalendarDays, UserCheck } from 'lucide-react'

export default function RegionalDashboardPage() {
  return (
    <main className="min-h-screen bg-[#eef3ef] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Regional Access</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Admin Regional Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola event daerah, peserta regional, dan monitoring wilayah.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Wilayah', value: 'Aktif', icon: Building2 },
            { label: 'Event Daerah', value: 'Manage', icon: CalendarDays },
            { label: 'Peserta', value: 'Monitor', icon: UserCheck },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-emerald-700" />
                <p className="mt-4 text-sm text-gray-400">{item.label}</p>
                <p className="text-lg font-extrabold text-[#1B4332]">{item.value}</p>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
