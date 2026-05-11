import { Crown, ShieldCheck, UsersRound } from 'lucide-react'

export default function SuperAdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#eef3ef] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Full Access</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Super Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Monitoring nasional, approval system, regional management, dan master settings.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Global Analytics', value: 'Ready', icon: ShieldCheck },
            { label: 'Regional', value: 'Manage', icon: UsersRound },
            { label: 'Approval', value: 'Centralized', icon: Crown },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-[#C9A227]" />
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
