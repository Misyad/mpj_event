import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight, BadgeCheck, CalendarDays, FileBadge2, PencilLine, Ticket, UserRound } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getUserDashboard } from '@/lib/server/dashboard'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { formatEventDateTime } from '@/utils/dateFormatter'

export const dynamic = 'force-dynamic'

export default async function UserDashboardPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fdashboard')

  const dashboard = await getUserDashboard(session)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-[#1B4332] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15">
            <UserRound className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Dashboard Peserta</p>
            <h1 className="mt-1 truncate text-xl font-extrabold">{dashboard.profile?.fullName || session.fullName || 'Akun MPJ Event'}</h1>
            <p className="mt-1 truncate text-sm text-white/65">{dashboard.profile?.email || session.email || 'Peserta MPJ Event'}</p>
          </div>
        </div>
        <Link href="/profile/edit" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1B4332] transition hover:bg-[#f4f7f5]">
          <PencilLine className="h-4 w-4" />
          Edit Profil
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Event Diikuti', value: dashboard.summary.events, icon: CalendarDays },
          { label: 'Event Aktif', value: dashboard.summary.activeEvents, icon: Ticket },
          { label: 'Sertifikat', value: dashboard.summary.certificates, icon: FileBadge2 },
          { label: 'Rekomendasi', value: dashboard.summary.recommendations, icon: BadgeCheck },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#1B4332]">{item.value}</p>
              <p className="text-xs font-bold text-gray-500">{item.label}</p>
            </div>
          )
        })}
      </section>

      {!dashboard.profileComplete ? (
        <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm font-extrabold text-[#1B4332]">Profil belum lengkap.</p>
          <p className="mt-1 text-sm text-gray-600">Lengkapi WhatsApp dan instansi agar pendaftaran event memakai data akun otomatis.</p>
          <Link href="/profile/edit" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-4 py-2 text-sm font-bold text-white">
            Lengkapi Profil <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#1B4332]">Riwayat Event</h2>
            <Link href="/profile/events" className="text-xs font-bold text-[#1B4332] hover:underline">Lihat semua</Link>
          </div>
          <div className="divide-y divide-black/5">
            {dashboard.eventHistory.length === 0 ? (
              <p className="p-8 text-center text-sm font-semibold text-gray-400">Belum ada riwayat event.</p>
            ) : dashboard.eventHistory.map((item) => (
              <Link key={item.participant.id} href={`/events/${item.event.slug ?? item.event.id}`} className="block px-5 py-4 transition hover:bg-[#f4f7f5]">
                <p className="truncate text-sm font-bold text-[#1B4332]">{item.event.title}</p>
                <p className="mt-1 text-xs text-gray-500">{formatEventDateTime(item.event.dateStart ?? item.event.start_date)} - {item.participant.payment_status}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 className="text-sm font-extrabold text-[#1B4332]">Event Tersedia</h2>
            <Link href="/" className="text-xs font-bold text-[#1B4332] hover:underline">Beranda</Link>
          </div>
          <div className="divide-y divide-black/5">
            {dashboard.recommendedEvents.length === 0 ? (
              <p className="p-8 text-center text-sm font-semibold text-gray-400">Belum ada rekomendasi event baru.</p>
            ) : dashboard.recommendedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.slug ?? event.id}`} className="block px-5 py-4 transition hover:bg-[#f4f7f5]">
                <p className="truncate text-sm font-bold text-[#1B4332]">{event.title}</p>
                <p className="mt-1 text-xs text-gray-500">{formatEventDateTime(event.dateStart ?? event.start_date)} - {event.location ?? event.location_name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
