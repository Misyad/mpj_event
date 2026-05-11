import { CalendarDays, FileUp, Trophy, UserRound } from 'lucide-react'

export default function UserDashboardPage() {
  return (
    <main className="min-h-screen bg-[#eef3ef] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Participant</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Dashboard Peserta</h1>
          <p className="mt-1 text-sm text-gray-500">Daftar lomba, lihat jadwal, upload berkas, dan pantau hasil.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: 'Jadwal', value: 'Lihat', icon: CalendarDays },
            { label: 'Berkas', value: 'Upload', icon: FileUp },
            { label: 'Hasil', value: 'Pantau', icon: Trophy },
            { label: 'Profil', value: 'Kelola', icon: UserRound },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-blue-700" />
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
