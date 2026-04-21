import { dummyAdminStats, dummyEvents } from '@/lib/dummy'
import { AlertCircle, ArrowUpRight, Calendar, CheckCircle, Database, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { BadgeStatus } from '@/components/BadgeStatus'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatCurrency(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function AdminDashboardPage() {
  const stats = dummyAdminStats
  const pendingEvents = dummyEvents.filter(e => e.status === 'PENDING').slice(0, 3)
  const recentEvents = [...dummyEvents].slice(0, 5)

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* ─── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332] tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selamat datang di panel administrasi MPJ Event.</p>
        </div>
        <Link href="/admin/events">
          <div className="inline-flex items-center gap-2 bg-[#1B4332] hover:bg-[#14532d] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer">
            <Calendar className="w-4 h-4" />
            Kelola Event
          </div>
        </Link>
      </div>

      {/* ─── Stats Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Event', value: stats.total_events, icon: Calendar, bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', trend: '+2 bulan ini' },
          { label: 'Menunggu Approval', value: stats.pending_approval, icon: AlertCircle, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', trend: 'Perlu ditinjau' },
          { label: 'Total Peserta', value: stats.total_participants, icon: Users, bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', trend: 'Semua event' },
          { label: 'Total Pesantren', value: stats.total_pesantren, icon: Database, bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: 'Anggota aktif' },
        ].map(({ label, value, icon: Icon, bg, iconBg, iconColor, trend }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 md:p-5 border border-white/80 shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`${iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-[#1B4332]">{value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
            <p className="text-[10px] text-gray-400 mt-1">{trend}</p>
          </div>
        ))}
      </div>

      {/* ─── Two-column Grid ─────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">

        {/* Pending Approval */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="font-bold text-[#1B4332] text-sm">Menunggu Persetujuan</h2>
            </div>
            <Link href="/admin/events" className="flex items-center gap-1 text-xs text-[#C9A227] font-semibold hover:underline">
              Lihat Semua <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingEvents.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Semua event sudah ditinjau</p>
                <p className="text-xs text-gray-400 mt-1">Tidak ada event menunggu approval</p>
              </div>
            ) : pendingEvents.map(event => (
              <Link key={event.id} href={`/admin/events/${event.id}`}>
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B4332] line-clamp-1 group-hover:text-[#C9A227] transition-colors">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.category} · {formatDate(event.start_date)}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#C9A227] transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-[#1B4332] text-sm">Event Terbaru</h2>
            <Link href="/admin/events" className="flex items-center gap-1 text-xs text-[#C9A227] font-semibold hover:underline">
              Lihat Semua <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEvents.map(event => (
              <Link key={event.id} href={`/admin/events/${event.id}`}>
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B4332] line-clamp-1 group-hover:text-[#C9A227] transition-colors">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.start_date)} · {event.location_name}</p>
                  </div>
                  <BadgeStatus status={event.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Quick Links (Mobile-friendly) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Master Event', desc: 'Kelola & approve event', href: '/admin/events', icon: Calendar, color: 'bg-blue-600' },
          { label: 'Master Data', desc: 'Pesantren & kru', href: '/admin/master-data', icon: Database, color: 'bg-purple-600' },
          { label: 'Scan Absensi', desc: 'QR scanner panitia', href: '/scan', icon: Users, color: 'bg-emerald-600' },
        ].map(({ label, desc, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer group">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-sm font-bold text-[#1B4332] group-hover:text-[#C9A227] transition-colors">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
