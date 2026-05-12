'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Clock, ExternalLink, Loader2, Search, Ticket, UserCheck, Wallet, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AttendanceStatus, EventStatus, PaymentStatus, RegistrationPath } from '@/types'

type RegionalParticipant = {
  id: string
  event_id: string
  registration_path: RegistrationPath
  payment_status: PaymentStatus
  unique_amount: number
  attendance_status: AttendanceStatus
  qr_token: string
  ticketCode?: string
  full_name?: string
  fullName?: string
  institution_name?: string
  institution?: string
  whatsapp?: string
  crew?: { full_name: string; unit: string; niam: string }
  guest?: { full_name: string; institution_name: string; whatsapp: string; id?: string }
  event: {
    id: string
    title: string
    status: EventStatus
    start_date: string
    location_name: string
  }
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    Free: { label: 'Gratis', className: 'bg-blue-100 text-blue-700' },
    Paid: { label: 'Lunas', className: 'bg-emerald-100 text-emerald-700' },
    Pending_Approval: { label: 'Menunggu Verif', className: 'bg-amber-100 text-amber-700' },
    Unpaid: { label: 'Belum Bayar', className: 'bg-red-100 text-red-600' },
  }
  const item = map[status]
  return <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${item.className}`}>{item.label}</span>
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const normalized = String(status).toLowerCase()
  const isAttended = normalized === 'attended'
  const isConfirmed = normalized === 'confirmed'
  const isCancelled = normalized === 'cancelled'
  return (
    <span className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      isAttended
        ? 'bg-emerald-100 text-emerald-700'
        : isConfirmed
          ? 'bg-blue-100 text-blue-700'
          : isCancelled
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600'
    }`}>
      {isAttended || isConfirmed ? <CheckCircle2 className="h-3 w-3" /> : isCancelled ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {isAttended ? 'Hadir' : isConfirmed ? 'Confirmed' : isCancelled ? 'Dibatalkan' : 'Terdaftar'}
    </span>
  )
}

function PathBadge({ path }: { path: RegistrationPath }) {
  return path === 'NIAM'
    ? <span className="rounded-full bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">NIAM</span>
    : <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Umum</span>
}

function sameStatus(value: string | undefined, filter: string) {
  return String(value || '').toLowerCase() === filter.toLowerCase()
}

export default function RegionalParticipantsPage() {
  const [participants, setParticipants] = useState<RegionalParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('ALL')
  const [pathFilter, setPathFilter] = useState('ALL')
  const [payFilter, setPayFilter] = useState('ALL')
  const [attendFilter, setAttendFilter] = useState('ALL')

  useEffect(() => {
    let active = true

    async function loadParticipants() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch('/api/regional/participants', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat peserta regional')
        if (active) setParticipants(payload.data ?? [])
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat peserta regional')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadParticipants()
    return () => {
      active = false
    }
  }, [])

  const enriched = useMemo(() => participants.map((participant) => ({
    ...participant,
    name: participant.fullName ?? participant.full_name ?? (participant.registration_path === 'NIAM' ? participant.crew?.full_name : participant.guest?.full_name),
    institution: participant.institution ?? participant.institution_name ?? (participant.registration_path === 'NIAM' ? participant.crew?.unit : participant.guest?.institution_name),
    contact: participant.whatsapp ?? (participant.registration_path === 'NIAM' ? participant.crew?.niam : participant.guest?.whatsapp),
    avatar: participant.registration_path === 'NIAM'
      ? `https://avatar.iran.liara.run/public/boy?username=${participant.crew?.niam ?? participant.id}`
      : `https://avatar.iran.liara.run/public/girl?username=${participant.guest?.id ?? participant.id}`,
  })), [participants])

  const eventOptions = useMemo(() => {
    const byId = new Map<string, RegionalParticipant['event']>()
    enriched.forEach((participant) => {
      if (participant.event) byId.set(participant.event.id, participant.event)
    })
    return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title))
  }, [enriched])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return enriched.filter((participant) => {
      const matchesSearch =
        !keyword ||
        participant.name?.toLowerCase().includes(keyword) ||
        participant.institution?.toLowerCase().includes(keyword) ||
        participant.contact?.toLowerCase().includes(keyword) ||
        participant.event?.title.toLowerCase().includes(keyword)
      const matchesEvent = eventFilter === 'ALL' || participant.event_id === eventFilter
      const matchesPath = pathFilter === 'ALL' || participant.registration_path === pathFilter
      const matchesPayment = payFilter === 'ALL' || participant.payment_status === payFilter
      const matchesAttendance = attendFilter === 'ALL' || sameStatus(participant.attendance_status, attendFilter)
      return matchesSearch && matchesEvent && matchesPath && matchesPayment && matchesAttendance
    })
  }, [attendFilter, enriched, eventFilter, pathFilter, payFilter, search])

  const stats = useMemo(() => ({
    total: enriched.length,
    niam: enriched.filter((participant) => participant.registration_path === 'NIAM').length,
    umum: enriched.filter((participant) => participant.registration_path === 'UMUM').length,
    hadir: enriched.filter((participant) => sameStatus(participant.attendance_status, 'Attended')).length,
    lunas: enriched.filter((participant) => participant.payment_status === 'Paid').length,
    pending: enriched.filter((participant) => participant.payment_status === 'Pending_Approval' || participant.payment_status === 'Unpaid').length,
  }), [enriched])

  function resetFilters() {
    setSearch('')
    setEventFilter('ALL')
    setPathFilter('ALL')
    setPayFilter('ALL')
    setAttendFilter('ALL')
  }

  const hasFilter = search || eventFilter !== 'ALL' || pathFilter !== 'ALL' || payFilter !== 'ALL' || attendFilter !== 'ALL'

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Regional Scope</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Peserta Regional</h1>
            <p className="mt-1 text-sm text-gray-500">Monitoring peserta untuk event regional sesuai akses admin.</p>
          </div>
          {hasFilter ? (
            <button type="button" onClick={resetFilters} className="text-xs font-semibold text-gray-400 transition-colors hover:text-red-500">
              Reset Filter
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {[
            { label: 'Total', value: stats.total, icon: <UserCheck className="h-4 w-4" />, color: 'text-[#1B4332]', bg: 'bg-[#1B4332]/10', action: resetFilters },
            { label: 'NIAM', value: stats.niam, icon: <Ticket className="h-4 w-4" />, color: 'text-[#1B4332]', bg: 'bg-emerald-100', action: () => { resetFilters(); setPathFilter('NIAM') } },
            { label: 'Umum', value: stats.umum, icon: <Ticket className="h-4 w-4" />, color: 'text-indigo-600', bg: 'bg-indigo-100', action: () => { resetFilters(); setPathFilter('UMUM') } },
            { label: 'Hadir', value: stats.hadir, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', action: () => { resetFilters(); setAttendFilter('Attended') } },
            { label: 'Lunas', value: stats.lunas, icon: <Wallet className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', action: () => { resetFilters(); setPayFilter('Paid') } },
            { label: 'Pending', value: stats.pending, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-100', action: () => { resetFilters(); setPayFilter('Unpaid') } },
          ].map((stat) => (
            <button key={stat.label} type="button" onClick={stat.action} className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50">
              <div className={`mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, event, instansi..." className="h-9 rounded-xl border-gray-200 pl-9 text-sm" />
          </div>
          <Select value={eventFilter} onValueChange={(value) => value != null && setEventFilter(value)}>
            <SelectTrigger className="h-9 w-full rounded-xl border-gray-200 text-sm sm:w-56">
              <SelectValue placeholder="Semua Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Event</SelectItem>
              {eventOptions.map((event) => (
                <SelectItem key={event.id} value={event.id}>{event.title.slice(0, 38)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pathFilter} onValueChange={(value) => value != null && setPathFilter(value)}>
            <SelectTrigger className="h-9 w-full rounded-xl border-gray-200 text-sm sm:w-36">
              <SelectValue placeholder="Jalur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jalur</SelectItem>
              <SelectItem value="NIAM">NIAM</SelectItem>
              <SelectItem value="UMUM">Umum</SelectItem>
            </SelectContent>
          </Select>
          <Select value={payFilter} onValueChange={(value) => value != null && setPayFilter(value)}>
            <SelectTrigger className="h-9 w-full rounded-xl border-gray-200 text-sm sm:w-44">
              <SelectValue placeholder="Status Bayar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="Free">Gratis</SelectItem>
              <SelectItem value="Paid">Lunas</SelectItem>
              <SelectItem value="Pending_Approval">Menunggu Verif</SelectItem>
              <SelectItem value="Unpaid">Belum Bayar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={attendFilter} onValueChange={(value) => value != null && setAttendFilter(value)}>
            <SelectTrigger className="h-9 w-full rounded-xl border-gray-200 text-sm sm:w-40">
              <SelectValue placeholder="Kehadiran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kehadiran</SelectItem>
              <SelectItem value="Registered">Terdaftar</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Attended">Hadir</SelectItem>
              <SelectItem value="Cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-gray-400">
          Menampilkan <span className="font-bold text-gray-600">{filtered.length}</span> dari {enriched.length} peserta regional
          {hasFilter ? <span className="font-semibold text-[#1B4332]"> (difilter)</span> : null}
        </p>

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-[#1B4332]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat peserta regional...
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Peserta</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Jalur</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Bayar</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Kehadiran</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Nominal</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-gray-400">Tidak ada peserta ditemukan</td>
                      </tr>
                    ) : filtered.map((participant) => (
                      <tr key={participant.id} className="transition-colors hover:bg-gray-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Image src={participant.avatar} alt={participant.name ?? 'Peserta'} width={32} height={32} className="h-8 w-8 shrink-0 rounded-full bg-gray-100 object-cover" />
                            <div>
                              <p className="text-sm font-semibold leading-tight text-gray-800">{participant.name ?? '-'}</p>
                              <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-gray-400">{participant.institution ?? '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="max-w-[220px] text-xs font-medium leading-snug text-gray-700 line-clamp-2">{participant.event?.title ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3.5"><PathBadge path={participant.registration_path} /></td>
                        <td className="px-4 py-3.5"><PaymentBadge status={participant.payment_status} /></td>
                        <td className="px-4 py-3.5"><AttendanceBadge status={participant.attendance_status} /></td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-bold text-gray-700">{participant.unique_amount === 0 ? '-' : `Rp ${participant.unique_amount.toLocaleString('id-ID')}`}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            <Link href="/regional/events" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-[#1B4332] hover:text-[#1B4332]">
                              <ExternalLink className="h-3 w-3" />
                              Event
                            </Link>
                            <Link href={`/ticket/${encodeURIComponent(participant.ticketCode || participant.qr_token)}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-[#1B4332] hover:text-[#1B4332]">
                              Tiket
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 md:hidden">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Tidak ada peserta ditemukan</div>
                ) : filtered.map((participant) => (
                  <div key={participant.id} className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <Image src={participant.avatar} alt={participant.name ?? 'Peserta'} width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-800">{participant.name ?? '-'}</p>
                        <p className="truncate text-[10px] text-gray-400">{participant.institution ?? '-'}</p>
                      </div>
                      <PathBadge path={participant.registration_path} />
                    </div>
                    <p className="text-xs font-medium text-gray-500 line-clamp-1">Event: {participant.event?.title ?? '-'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <PaymentBadge status={participant.payment_status} />
                      <AttendanceBadge status={participant.attendance_status} />
                      {participant.unique_amount > 0 ? (
                        <span className="text-[10px] font-semibold text-gray-500">Rp {participant.unique_amount.toLocaleString('id-ID')}</span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Link href="/regional/events" className="text-xs font-semibold text-[#1B4332] hover:underline">Daftar event</Link>
                      <Link href={`/ticket/${encodeURIComponent(participant.ticketCode || participant.qr_token)}`} className="text-xs font-semibold text-[#1B4332] hover:underline">Tiket</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
