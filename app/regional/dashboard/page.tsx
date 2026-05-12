import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, CalendarDays, CheckCircle2, Clock, MapPin, Ticket, UserCheck, Wallet } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getAdminParticipantsFromDb, getEventsFromDb } from '@/lib/server/events'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function sameStatus(value: string | undefined, target: string) {
  return String(value || '').toLowerCase() === target.toLowerCase()
}

export default async function RegionalDashboardPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.regionalAdmin)
  if (!session?.regionalId) redirect('/auth/regional-admin-login')

  const [allEvents, participants] = await Promise.all([
    getEventsFromDb(),
    getAdminParticipantsFromDb({ scope: 'regional', regionId: session.regionalId }),
  ])
  const events = allEvents.filter((event) => event.scope === 'regional' && event.regionId === session.regionalId)
  const attendedCount = participants.filter((participant) => sameStatus(participant.attendance_status, 'Attended')).length
  const paidCount = participants.filter((participant) => participant.payment_status === 'Paid' || participant.payment_status === 'Free').length
  const pendingCount = participants.filter((participant) => participant.payment_status === 'Unpaid' || participant.payment_status === 'Pending_Approval').length
  const openEvents = events.filter((event) => event.status_pendaftaran !== 'closed' && !['finished', 'completed'].includes(String(event.status).toLowerCase())).length
  const recentEvents = events.slice(0, 5)

  return (
    <main className="min-h-screen bg-[#eef3ef] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Regional Access</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Admin Regional Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Monitoring event, peserta, pembayaran, dan kehadiran sesuai scope regional.</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
            {session.regionalId}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Event Regional', value: events.length, note: `${openEvents} masih berjalan`, icon: CalendarDays, color: 'text-[#1B4332]', bg: 'bg-emerald-50' },
            { label: 'Total Peserta', value: participants.length, note: 'Semua event regional', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Sudah Hadir', value: attendedCount, note: 'Check-in QR', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pembayaran Beres', value: paidCount, note: `${pendingCount} menunggu`, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="mt-4 text-sm text-gray-400">{item.label}</p>
                <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
                <p className="mt-1 text-xs font-medium text-gray-400">{item.note}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B4332]">Event Terbaru</h2>
                <p className="text-xs text-gray-400">Ringkasan event dalam scope regional</p>
              </div>
              <Link href="/regional/events" className="text-xs font-bold text-emerald-700 hover:underline">
                Lihat semua
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentEvents.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-gray-400">Belum ada event regional.</div>
              ) : recentEvents.map((event) => (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{event.status}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{event.category}</span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold text-[#1B4332]">{event.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{event.description}</p>
                    </div>
                    <div className="grid gap-2 text-xs font-medium text-gray-500 md:min-w-56">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-700" />{formatDate(event.dateStart ?? event.start_date)}</span>
                      <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-700" />{event.location ?? event.location_name ?? '-'}</span>
                      <span className="flex items-center gap-2"><Ticket className="h-4 w-4 text-emerald-700" />{event.registeredCount ?? 0}/{event.quota ?? '-'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-[#1B4332]">Kondisi Peserta</h2>
            </div>
            <div className="mt-5 space-y-4">
              {[
                { label: 'Check-in', value: attendedCount, total: Math.max(participants.length, 1), color: 'bg-emerald-600' },
                { label: 'Pembayaran Beres', value: paidCount, total: Math.max(participants.length, 1), color: 'bg-amber-500' },
                { label: 'Menunggu Pembayaran', value: pendingCount, total: Math.max(participants.length, 1), color: 'bg-red-500' },
              ].map((item) => {
                const percent = Math.min(100, Math.round((item.value / item.total) * 100))
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-600">{item.label}</span>
                      <span className="font-bold text-[#1B4332]">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full ${item.color}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <Link href="/regional/participants" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d]">
              <Clock className="h-4 w-4" />
              Monitor Peserta
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
