import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, ArrowUpRight, Banknote, Calendar, CheckCircle2, MapPinned, ReceiptText, TrendingUp, Users } from 'lucide-react'
import { BadgeStatus } from '@/components/BadgeStatus'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getAdminPusatDashboard } from '@/lib/server/dashboard'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export default async function AdminPusatDashboardPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.superAdmin)
  if (!session) redirect('/auth/super-admin-login?next=%2Fadmin-pusat%2Fdashboard')

  const dashboard = await getAdminPusatDashboard(session)
  const stats = [
    { label: 'Total Event', value: dashboard.summary.total, note: `${dashboard.summary.open} masih berjalan`, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Menunggu Approval', value: dashboard.summary.pendingApproval, note: 'Perlu ditinjau pusat', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Peserta', value: dashboard.summary.participants, note: `${dashboard.summary.attended} sudah hadir`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Regional Aktif', value: dashboard.summary.regionalCount, note: `${dashboard.regionalBreakdown.length} regional terdaftar`, icon: MapPinned, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">Backend Dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Dashboard Admin Pusat</h1>
          <p className="mt-1 text-sm text-gray-500">Ringkasan operasional global dari database event, peserta, payment, regional, dan finance.</p>
        </div>
        <Link href="/admin-pusat/events" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#14532d]">
          <Calendar className="h-4 w-4" />
          Kelola Event
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className={`${item.bg} rounded-2xl border border-white p-4 shadow-sm md:p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-gray-300" />
              </div>
              <p className={`mt-4 text-3xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-sm font-bold text-[#1B4332]">{item.label}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">{item.note}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-[#1B4332]">Keuangan Global</h2>
          </div>
          <div className="mt-5 space-y-3">
            <FinanceRow label="Pemasukan" value={formatCurrency(dashboard.summary.finance.totalIncome)} />
            <FinanceRow label="Pengeluaran" value={formatCurrency(dashboard.summary.finance.totalExpense)} />
            <FinanceRow label="Saldo" value={formatCurrency(dashboard.summary.finance.balance)} strong />
          </div>
          <Link href="/admin-pusat/finance/recap" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">
            Buka rekap <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-[#1B4332]">Kondisi Peserta</h2>
          </div>
          <div className="mt-5 space-y-4">
            <ProgressRow label="Pembayaran beres" value={dashboard.summary.paid} total={Math.max(dashboard.summary.participants, 1)} color="bg-emerald-600" />
            <ProgressRow label="Menunggu pembayaran" value={dashboard.summary.pendingPayment} total={Math.max(dashboard.summary.participants, 1)} color="bg-amber-500" />
            <ProgressRow label="Sudah hadir" value={dashboard.summary.attended} total={Math.max(dashboard.summary.participants, 1)} color="bg-blue-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-[#1B4332]">Payment Terbaru</h2>
          </div>
          <div className="mt-4 space-y-3">
            {dashboard.recentPayments.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-gray-400">Belum ada payment.</p>
            ) : dashboard.recentPayments.map((payment) => (
              <div key={payment.paymentId} className="rounded-xl bg-gray-50 p-3">
                <p className="truncate text-sm font-bold text-[#1B4332]">{payment.participantName}</p>
                <p className="mt-1 truncate text-xs text-gray-500">{payment.eventTitle}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs font-bold">
                  <span className="text-emerald-700">{formatCurrency(payment.amount)}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-gray-600">{payment.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <EventList title="Menunggu Persetujuan" empty="Tidak ada event menunggu approval." events={dashboard.pendingEvents} />
        <EventList title="Event Terbaru" empty="Belum ada event." events={dashboard.recentEvents} />
      </section>
    </main>
  )
}

function FinanceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-gray-500">{label}</span>
      <span className={strong ? 'text-base font-extrabold text-[#1B4332]' : 'font-bold text-gray-700'}>{value}</span>
    </div>
  )
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = Math.min(100, Math.round((value / total) * 100))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-600">{label}</span>
        <span className="font-bold text-[#1B4332]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function EventList({ title, empty, events }: { title: string; empty: string; events: Awaited<ReturnType<typeof getAdminPusatDashboard>>['recentEvents'] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <h2 className="text-sm font-extrabold text-[#1B4332]">{title}</h2>
        <Link href="/admin-pusat/events" className="inline-flex items-center gap-1 text-xs font-bold text-[#C9A227] hover:underline">
          Lihat semua <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm font-semibold text-gray-400">{empty}</p>
        ) : events.map((event) => (
          <Link key={event.id} href={`/admin-pusat/events/${event.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#1B4332]">{event.title}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{formatDate(event.dateStart ?? event.start_date)} - {event.location ?? event.location_name}</p>
            </div>
            <BadgeStatus status={event.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
