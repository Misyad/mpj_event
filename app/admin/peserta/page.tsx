'use client'

import { useState, useMemo } from 'react'
import { dummyParticipants, dummyEvents } from '@/lib/dummy'
import { AttendanceStatus, PaymentStatus, RegistrationPath } from '@/types'
import { Search, Filter, CheckCircle2, Clock, XCircle, Wallet, Ticket, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Badge helpers
function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; class: string }> = {
    Free:             { label: 'Gratis',          class: 'bg-blue-100 text-blue-700' },
    Paid:             { label: 'Lunas',            class: 'bg-emerald-100 text-emerald-700' },
    Pending_Approval: { label: 'Menunggu Verif',  class: 'bg-amber-100 text-amber-700' },
    Unpaid:           { label: 'Belum Bayar',     class: 'bg-red-100 text-red-600' },
  }
  const { label, class: cls } = map[status]
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; icon: React.ReactNode; class: string }> = {
    Registered: { label: 'Terdaftar',  icon: <Clock className="w-3 h-3" />,       class: 'bg-gray-100 text-gray-600' },
    Attended:   { label: 'Hadir',      icon: <CheckCircle2 className="w-3 h-3" />, class: 'bg-emerald-100 text-emerald-700' },
    Cancelled:  { label: 'Dibatalkan', icon: <XCircle className="w-3 h-3" />,      class: 'bg-red-100 text-red-600' },
  }
  const { label, icon, class: cls } = map[status]
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${cls}`}>
      {icon}{label}
    </span>
  )
}

function PathBadge({ path }: { path: RegistrationPath }) {
  return path === 'NIAM'
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332]">NIAM</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Umum</span>
}

export default function MasterPesertaPage() {
  const [search, setSearch]             = useState('')
  const [pathFilter, setPathFilter]     = useState<string>('ALL')
  const [payFilter, setPayFilter]       = useState<string>('ALL')
  const [attendFilter, setAttendFilter] = useState<string>('ALL')
  const [eventFilter, setEventFilter]   = useState<string>('ALL')

  // Enrich participants with event data
  const enriched = useMemo(() => dummyParticipants.map(p => ({
    ...p,
    event: dummyEvents.find(e => e.id === p.event_id),
    name: p.registration_path === 'NIAM' ? p.crew?.full_name : p.guest?.full_name,
    institution: p.registration_path === 'NIAM' ? p.crew?.unit : p.guest?.institution_name,
    whatsapp: p.registration_path === 'UMUM' ? p.guest?.whatsapp : p.crew?.niam,
    avatar: p.registration_path === 'NIAM'
      ? `https://avatar.iran.liara.run/public/boy?username=${p.crew?.niam}`
      : `https://avatar.iran.liara.run/public/girl?username=${p.guest?.id}`,
  })), [])

  const filtered = useMemo(() => enriched.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.event?.title.toLowerCase().includes(q) ||
      p.institution?.toLowerCase().includes(q) ||
      p.whatsapp?.toLowerCase().includes(q)
    const matchPath    = pathFilter    === 'ALL' || p.registration_path    === pathFilter
    const matchPay     = payFilter     === 'ALL' || p.payment_status       === payFilter
    const matchAttend  = attendFilter  === 'ALL' || p.attendance_status    === attendFilter
    const matchEvent   = eventFilter   === 'ALL' || p.event_id             === eventFilter
    return matchSearch && matchPath && matchPay && matchAttend && matchEvent
  }), [enriched, search, pathFilter, payFilter, attendFilter, eventFilter])

  // Summary stats
  const stats = useMemo(() => ({
    total:    enriched.length,
    niam:     enriched.filter(p => p.registration_path === 'NIAM').length,
    umum:     enriched.filter(p => p.registration_path === 'UMUM').length,
    hadir:    enriched.filter(p => p.attendance_status === 'Attended').length,
    lunas:    enriched.filter(p => p.payment_status === 'Paid').length,
    pending:  enriched.filter(p => p.payment_status === 'Pending_Approval').length,
  }), [enriched])

  function resetFilters() {
    setSearch(''); setPathFilter('ALL'); setPayFilter('ALL')
    setAttendFilter('ALL'); setEventFilter('ALL')
  }

  const hasFilter = search || pathFilter !== 'ALL' || payFilter !== 'ALL' || attendFilter !== 'ALL' || eventFilter !== 'ALL'

  return (
    <div className="p-5 md:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332]">Master Peserta</h1>
          <p className="text-sm text-gray-400 mt-0.5">Semua pendaftar dari seluruh event</p>
        </div>
        {hasFilter && (
          <button onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Reset Filter
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        {[
          { label: 'Total',   value: stats.total,   icon: <UserCheck className="w-4 h-4" />, color: 'text-[#1B4332]', bg: 'bg-[#1B4332]/10', action: () => resetFilters() },
          { label: 'NIAM',    value: stats.niam,    icon: <Ticket className="w-4 h-4" />,    color: 'text-[#1B4332]', bg: 'bg-emerald-100', action: () => { resetFilters(); setPathFilter('NIAM') } },
          { label: 'Umum',    value: stats.umum,    icon: <Ticket className="w-4 h-4" />,    color: 'text-indigo-600', bg: 'bg-indigo-100', action: () => { resetFilters(); setPathFilter('UMUM') } },
          { label: 'Hadir',   value: stats.hadir,   icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', action: () => { resetFilters(); setAttendFilter('Attended') } },
          { label: 'Lunas',   value: stats.lunas,   icon: <Wallet className="w-4 h-4" />,   color: 'text-emerald-600', bg: 'bg-emerald-100', action: () => { resetFilters(); setPayFilter('Paid') } },
          { label: 'Pending', value: stats.pending, icon: <Clock className="w-4 h-4" />,    color: 'text-amber-600',  bg: 'bg-amber-100', action: () => { resetFilters(); setPayFilter('Pending_Approval') } },
        ].map(s => (
          <button key={s.label} onClick={s.action} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20">
            <div className={`w-7 h-7 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mx-auto mb-1.5`}>
              {s.icon}
            </div>
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, event, instansi..." className="pl-9 h-9 rounded-xl border-gray-200 text-sm" />
        </div>

        <Select value={eventFilter} onValueChange={v => v != null && setEventFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-52 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Semua Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Event</SelectItem>
            {dummyEvents.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.title.slice(0, 35)}...</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pathFilter} onValueChange={v => v != null && setPathFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-36 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Jalur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Jalur</SelectItem>
            <SelectItem value="NIAM">NIAM</SelectItem>
            <SelectItem value="UMUM">Umum</SelectItem>
          </SelectContent>
        </Select>

        <Select value={payFilter} onValueChange={v => v != null && setPayFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-44 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Status Bayar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status Bayar</SelectItem>
            <SelectItem value="Free">Gratis</SelectItem>
            <SelectItem value="Paid">Lunas</SelectItem>
            <SelectItem value="Pending_Approval">Menunggu Verif</SelectItem>
            <SelectItem value="Unpaid">Belum Bayar</SelectItem>
          </SelectContent>
        </Select>

        <Select value={attendFilter} onValueChange={v => v != null && setAttendFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-40 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Kehadiran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kehadiran</SelectItem>
            <SelectItem value="Registered">Terdaftar</SelectItem>
            <SelectItem value="Attended">Hadir</SelectItem>
            <SelectItem value="Cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-400">
        Menampilkan <span className="font-bold text-gray-600">{filtered.length}</span> dari {enriched.length} peserta
        {hasFilter && <span className="text-[#1B4332] font-semibold"> (difilter)</span>}
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Peserta</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Event</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Jalur</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Bayar</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Kehadiran</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada peserta ditemukan
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar} alt={p.name}
                        className="w-8 h-8 rounded-full bg-gray-100 object-cover shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{p.name ?? '-'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[160px]">{p.institution ?? '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-medium text-gray-700 max-w-[200px] line-clamp-2 leading-snug">
                      {p.event?.title ?? '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5"><PathBadge path={p.registration_path} /></td>
                  <td className="px-4 py-3.5"><PaymentBadge status={p.payment_status} /></td>
                  <td className="px-4 py-3.5"><AttendanceBadge status={p.attendance_status} /></td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-gray-700">
                      {p.unique_amount === 0 ? '—' : `Rp ${p.unique_amount.toLocaleString('id-ID')}`}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Tidak ada peserta ditemukan</div>
          ) : filtered.map(p => (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-xl bg-gray-100 object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{p.name ?? '-'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.institution ?? '-'}</p>
                </div>
                <PathBadge path={p.registration_path} />
              </div>
              <p className="text-xs text-gray-500 font-medium line-clamp-1">📅 {p.event?.title ?? '-'}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <PaymentBadge status={p.payment_status} />
                <AttendanceBadge status={p.attendance_status} />
                {p.unique_amount > 0 && (
                  <span className="text-[10px] text-gray-500 font-semibold">
                    Rp {p.unique_amount.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
