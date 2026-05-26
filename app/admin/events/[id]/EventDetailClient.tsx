'use client'

import { use, useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Award, Building2, Calendar, CheckCircle, CheckCircle2, CreditCard, ExternalLink, History, Info, Loader2, MapPin, Pencil, Plus, QrCode, ScanLine, Trash2, Users, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { normalizeEvent } from '@/lib/event-api'
import { EventFinancePanel } from '@/components/finance/EventFinancePanel'
import { BadgeStatus } from '@/components/BadgeStatus'
import { EventPosterImage } from '@/components/EventPosterImage'
import { EVENT_STATUS, eventStatusMeta, isCompletedStatus, normalizeEventStatus } from '@/lib/event-status'
import { formatEventDate, formatEventDateTime } from '@/utils/dateFormatter'
import type { Event, Participant, StaffMember } from '@/types'

const PAYMENT_COLORS: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-500', Unpaid: 'bg-red-100 text-red-600',
  Pending_Approval: 'bg-amber-100 text-amber-700', Paid: 'bg-emerald-100 text-emerald-700',
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}
function participantName(participant: Participant) {
  return participant.fullName ?? participant.full_name ?? participant.crew?.full_name ?? participant.guest?.full_name ?? '-'
}
function participantInstitution(participant: Participant) {
  return participant.institution ?? participant.institution_name ?? participant.crew?.unit ?? participant.guest?.institution_name ?? participant.email ?? participant.whatsapp ?? '-'
}
function isConfirmed(participant: Participant) {
  const status = String(participant.status || participant.attendance_status).toLowerCase()
  return status === 'confirmed' || status === 'attended'
}
function isAttended(participant: Participant) {
  return String(participant.status || participant.attendance_status).toLowerCase() === 'attended'
}

type ApprovalLog = {
  action: string
  metadata?: {
    previousStatus?: string
    nextStatus?: string
    reason?: string | null
    title?: string
  } | null
  actorName?: string | null
  actorEmail?: string | null
  createdAt: string
}

type StaffForm = {
  id?: string
  full_name: string
  niam: string
  role: string
  unit: string
}

const EMPTY_STAFF_FORM: StaffForm = {
  full_name: '',
  niam: '',
  role: '',
  unit: '',
}

export default function EventDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([])
  const [approvalTarget, setApprovalTarget] = useState<'published' | 'rejected' | null>(null)
  const [approvalReason, setApprovalReason] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [staffForm, setStaffForm] = useState<StaffForm | null>(null)
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffDeletingId, setStaffDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadEvent() {
      try {
        setIsLoading(true)
        setError('')
        const [response, logsResponse, staffResponse] = await Promise.all([
          fetch(`/api/admin/events/${encodeURIComponent(id)}`, { cache: 'no-store' }),
          fetch(`/api/admin/events/${encodeURIComponent(id)}/approval-logs`, { cache: 'no-store' }),
          fetch(`/api/admin/events/${encodeURIComponent(id)}/staff`, { cache: 'no-store' }),
        ])
        const [payload, logsPayload, staffPayload] = await Promise.all([response.json(), logsResponse.json(), staffResponse.json()])
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat detail event')
        if (!staffResponse.ok || !staffPayload.ok) throw new Error(staffPayload.error || 'Gagal memuat panitia event')

        const loadedEvent = normalizeEvent(payload.data)
        if (process.env.NODE_ENV !== 'production') {
          console.log('EVENT DETAIL', loadedEvent)
          console.log('EVENT IMAGE', loadedEvent.poster_url || loadedEvent.posterUrl)
        }
        if (!active) return
        setEvent(loadedEvent)
        setParticipants(payload.participants ?? [])
        setStaff(staffPayload.data ?? [])
        setApprovalLogs(logsResponse.ok && logsPayload.ok ? logsPayload.data ?? [] : [])
        setIsPublic(loadedEvent.is_open_for_public)
        setIsPaid(loadedEvent.is_paid)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail event')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadEvent()
    return () => {
      active = false
    }
  }, [id])

  async function confirmParticipant(participantId: string) {
    try {
      setConfirmingId(participantId)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(id)}/participants/${encodeURIComponent(participantId)}/confirm`, {
        method: 'POST',
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal confirm peserta')

      const updated = payload.data as Participant
      setParticipants((current) => current.map((participant) => (participant.id === updated.id ? updated : participant)))
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Gagal confirm peserta')
    } finally {
      setConfirmingId(null)
    }
  }

  async function updateEventStatus(status: 'published' | 'rejected') {
    if (!event) return
    if (status === 'rejected' && !approvalReason.trim()) {
      setError('Alasan penolakan approval wajib diisi')
      return
    }

    try {
      setIsApproving(true)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(event.id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, approvalReason }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal mengubah status event')

      setEvent(normalizeEvent(payload.data))
      const logsResponse = await fetch(`/api/admin/events/${encodeURIComponent(event.id)}/approval-logs`, { cache: 'no-store' })
      const logsPayload = await logsResponse.json()
      if (logsResponse.ok && logsPayload.ok) setApprovalLogs(logsPayload.data ?? [])
      setApprovalTarget(null)
      setApprovalReason('')
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : 'Gagal mengubah status event')
    } finally {
      setIsApproving(false)
    }
  }

  function openStaffForm(staffMember?: StaffMember) {
    setStaffForm(staffMember
      ? {
          id: staffMember.id,
          full_name: staffMember.full_name,
          niam: staffMember.niam,
          role: staffMember.role,
          unit: staffMember.unit,
        }
      : EMPTY_STAFF_FORM)
    setError('')
  }

  async function saveStaff() {
    if (!staffForm) return
    if (!staffForm.full_name.trim()) {
      setError('Nama panitia wajib diisi')
      return
    }

    try {
      setStaffSaving(true)
      setError('')
      const endpoint = staffForm.id
        ? `/api/admin/events/${encodeURIComponent(id)}/staff/${encodeURIComponent(staffForm.id)}`
        : `/api/admin/events/${encodeURIComponent(id)}/staff`
      const response = await fetch(endpoint, {
        method: staffForm.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(staffForm),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan panitia')

      const saved = payload.data as StaffMember
      setStaff((current) => staffForm.id ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
      setStaffForm(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan panitia')
    } finally {
      setStaffSaving(false)
    }
  }

  async function deleteStaff(staffId: string) {
    try {
      setStaffDeletingId(staffId)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(id)}/staff/${encodeURIComponent(staffId)}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menghapus panitia')
      setStaff((current) => current.filter((item) => item.id !== staffId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus panitia')
    } finally {
      setStaffDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 text-sm font-semibold text-[#1B4332]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat detail event...
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-lg font-bold text-[#1B4332]">{error || 'Event tidak ditemukan.'}</p>
        <Link href="/admin-pusat/events"><Button variant="outline" className="mt-4 rounded-xl">← Kembali</Button></Link>
      </div>
    )
  }

  const attendedCount = participants.filter(p => p.attendance_status === 'Attended').length
  const eventCompleted = isCompletedStatus(event.status)

  return (
    <div className="p-4 md:p-8 space-y-5">
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin-pusat/events">
          <button className="mt-1 p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-extrabold text-[#1B4332] line-clamp-2">{event.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <BadgeStatus status={event.status} />
            <span className="text-xs text-gray-400">{event.category}</span>
          </div>
        </div>
      </div>

      {/* 6-Tab System */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-gray-100 rounded-xl h-auto p-1 flex flex-wrap gap-1 w-full justify-start">
          {[
            { value: 'info', label: 'Info & Acara', icon: Info },
            { value: 'sdm', label: 'SDM', icon: Users },
            { value: 'peserta', label: 'Peserta', icon: Building2 },
            { value: 'keuangan', label: 'Keuangan', icon: CreditCard },
            { value: 'absensi', label: 'Absensi', icon: ScanLine },
            { value: 'status', label: 'Status', icon: QrCode },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">
              <Icon className="w-3.5 h-3.5" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Info & Acara */}
        <TabsContent value="info" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <EventPosterImage src={event.poster_url || event.posterUrl} alt={event.title} sizes="(max-width: 768px) 100vw, 720px" className="relative aspect-video w-full overflow-hidden rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={<Calendar className="w-4 h-4 text-[#C9A227]" />} label="Tanggal" value={formatEventDateTime(event.start_date)} />
              <InfoRow icon={<MapPin className="w-4 h-4 text-[#C9A227]" />} label="Lokasi" value={event.location_name} />
              <InfoRow icon={<Users className="w-4 h-4 text-[#C9A227]" />} label="Jalur Umum" value={event.is_open_for_public ? 'Terbuka' : 'Hanya Anggota'} />
              <InfoRow icon={<CreditCard className="w-4 h-4 text-[#C9A227]" />} label="Biaya" value={event.is_paid ? `NIAM: ${formatCurrency(event.price_niam)} | Umum: ${formatCurrency(event.price_public)}` : 'Gratis'} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Deskripsi</p>
              <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
            </div>
            {event.is_paid && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Rekening Tujuan</p>
                <p className="text-sm font-bold text-[#1B4332]">{event.bank_account.bank_name} — {event.bank_account.account_number}</p>
                <p className="text-xs text-gray-500">{event.bank_account.account_name}</p>
              </div>
            )}
            <a href={event.location_gmaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
              <MapPin className="w-4 h-4" /> Buka Google Maps
            </a>
          </div>
        </TabsContent>

        {/* Tab 2: SDM (Panitia) */}
        <TabsContent value="sdm" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-[#1B4332] text-sm">Daftar Panitia ({staff.length})</p>
              <Button size="sm" onClick={() => openStaffForm()} className="bg-[#1B4332] hover:bg-[#14532d] text-white rounded-xl text-xs h-8">
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>
            {staff.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Belum ada panitia terdaftar.</div>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-[#1B4332]">Nama</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">NIAM</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Jabatan</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Unit</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {staff.map(s => (
                    <TableRow key={s.id} className="hover:bg-green-50/40">
                      <TableCell className="font-semibold text-[#1B4332] text-sm">{s.full_name}</TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">{s.niam || '-'}</TableCell>
                      <TableCell><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{s.role}</span></TableCell>
                      <TableCell className="text-sm text-gray-600">{s.unit}</TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg px-2 text-xs" onClick={() => openStaffForm(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg border-red-100 px-2 text-xs text-red-600 hover:bg-red-50" onClick={() => deleteStaff(s.id)} disabled={staffDeletingId === s.id}>
                            {staffDeletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Peserta */}
        <TabsContent value="peserta" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-[#1B4332] text-sm">Daftar Peserta ({participants.length})</p>
            </div>
            {participants.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Belum ada peserta terdaftar.</div>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-[#1B4332]">Nama</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Jalur</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Pembayaran</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Kehadiran</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {participants.map(p => (
                    <TableRow key={p.id} className="hover:bg-green-50/40">
                      <TableCell>
                        <p className="font-semibold text-[#1B4332] text-sm">{participantName(p)}</p>
                        <p className="text-xs text-gray-400">{participantInstitution(p)}</p>
                      </TableCell>
                      <TableCell><span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.registration_path === 'NIAM' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{p.registration_path}</span></TableCell>
                      <TableCell><span className={`text-xs font-semibold px-2 py-1 rounded-full ${PAYMENT_COLORS[p.payment_status]}`}>{p.payment_status}</span></TableCell>
                      <TableCell><span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.attendance_status === 'Attended' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.attendance_status}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {!isConfirmed(p) && (
                            <button
                              type="button"
                              onClick={() => confirmParticipant(p.id)}
                              disabled={confirmingId === p.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {confirmingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Confirm
                            </button>
                          )}
                          <Link href={`/ticket/${encodeURIComponent(p.ticketCode || p.qr_token)}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-[#1B4332] hover:text-[#1B4332]">
                            <ExternalLink className="h-3 w-3" />
                            Tiket
                          </Link>
                          {isAttended(p) && eventCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#C9A227]/50 px-2.5 py-1 text-xs font-semibold text-[#8a6d16]">
                              <Award className="h-3 w-3" />
                              Generated via Event Card
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Keuangan */}
        <TabsContent value="keuangan" className="mt-4">
          <EventFinancePanel eventId={event.id} />
        </TabsContent>

        {/* Tab 5: Absensi */}
        <TabsContent value="absensi" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-[#1B4332] text-sm">Log Kehadiran</p>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">{attendedCount} Hadir</span>
            </div>
            {participants.filter(p => p.attendance_status === 'Attended').length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Belum ada peserta yang diabsen.</div>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-[#1B4332]">Nama Peserta</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Jalur</TableHead>
                  <TableHead className="font-bold text-[#1B4332]">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {participants.filter(p => p.attendance_status === 'Attended').map(p => (
                    <TableRow key={p.id} className="hover:bg-green-50/40">
                      <TableCell>
                        <p className="font-semibold text-[#1B4332] text-sm">{participantName(p)}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.qr_token}</p>
                      </TableCell>
                      <TableCell><span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.registration_path === 'NIAM' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{p.registration_path}</span></TableCell>
                      <TableCell><span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Hadir</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab 6: Status */}
        <TabsContent value="status" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <p className="font-bold text-[#1B4332] text-sm">Pengaturan Event</p>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Alur Approval Pusat</p>
              <p className="mt-1 text-sm text-gray-600">
                Approve mengubah event menjadi Published dan siap tampil publik. Tolak membuat event berstatus Ditolak dan menyimpan alasan revisi di riwayat.
              </p>
              {normalizeEventStatus(event.status) === 'pending' ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setApprovalTarget('published')}>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Event
                  </Button>
                  <Button type="button" variant="outline" className="rounded-xl border-red-100 text-red-600 hover:bg-red-50" onClick={() => setApprovalTarget('rejected')}>
                    <XCircle className="h-4 w-4" />
                    Tolak Approval
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-[#1B4332]">Buka Jalur Umum</p>
                <p className="text-xs text-gray-400 mt-0.5">Izinkan peserta non-anggota mendaftar</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-[#1B4332]">Event Berbayar</p>
                <p className="text-xs text-gray-400 mt-0.5">Aktifkan sistem pembayaran</p>
              </div>
              <Switch checked={isPaid} onCheckedChange={setIsPaid} />
            </div>
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ubah Status Event</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_STATUS.map((status) => {
                  const active = normalizeEventStatus(event.status) === status.value
                  const meta = eventStatusMeta(status.value)
                  return (
                  <button key={status.value} type="button" disabled className={`text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-colors ${active ? 'border-[#1B4332] bg-[#1B4332] text-white' : `border-gray-200 ${meta.badgeClassName}`}`}>
                    {meta.label}
                  </button>
                  )
                })}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-[#C9A227]" />
                <p className="font-bold text-[#1B4332] text-sm">Riwayat Approval</p>
              </div>
              {approvalLogs.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-4 text-sm font-medium text-gray-500">Belum ada riwayat approval.</div>
              ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {approvalLogs.map((log, index) => (
                    <div key={`${log.action}-${log.createdAt}-${index}`} className="p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#1B4332]">{normalizeEventStatus(log.metadata?.nextStatus) === 'rejected' ? 'Approval ditolak' : 'Approval disetujui'}</p>
                          <p className="text-xs text-gray-500">{log.actorName ?? log.actorEmail ?? 'Admin'} - {log.metadata?.previousStatus ?? '-'} ke {log.metadata?.nextStatus ?? '-'}</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-400">{formatEventDate(log.createdAt)}</p>
                      </div>
                      {log.metadata?.reason ? <p className="mt-2 text-sm text-gray-600">{log.metadata.reason}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(approvalTarget)} onOpenChange={(open) => {
        if (!open) {
          setApprovalTarget(null)
          setApprovalReason('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalTarget === 'published' ? 'Approve Event?' : 'Tolak Approval Event?'}</DialogTitle>
            <DialogDescription>
              {approvalTarget === 'published'
                ? 'Event akan menjadi Published dan siap tampil di publik sesuai pengaturan event.'
                : 'Event akan berstatus Ditolak dan alasan penolakan tersimpan di riwayat approval.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#1B4332]">{event.title}</p>
            {approvalTarget === 'rejected' ? (
              <div className="space-y-1.5">
                <Label>Alasan Penolakan</Label>
                <Textarea value={approvalReason} onChange={(changeEvent) => setApprovalReason(changeEvent.target.value)} placeholder="Tuliskan revisi yang perlu dilakukan..." />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApprovalTarget(null)} disabled={isApproving}>Batal</Button>
            <Button type="button" className={approvalTarget === 'published' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'} onClick={() => approvalTarget && updateEventStatus(approvalTarget)} disabled={isApproving}>
              {isApproving ? 'Memproses...' : approvalTarget === 'published' ? 'Approve' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(staffForm)} onOpenChange={(open) => {
        if (!open) setStaffForm(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{staffForm?.id ? 'Edit Panitia' : 'Tambah Panitia'}</DialogTitle>
            <DialogDescription>Data panitia tersimpan di backend dan tampil kembali setelah halaman direfresh.</DialogDescription>
          </DialogHeader>
          {staffForm ? (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label>Nama Lengkap</Label>
                <Input value={staffForm.full_name} onChange={(changeEvent) => setStaffForm((current) => current ? { ...current, full_name: changeEvent.target.value } : current)} placeholder="Nama panitia" />
              </div>
              <div className="space-y-1.5">
                <Label>NIAM</Label>
                <Input value={staffForm.niam} onChange={(changeEvent) => setStaffForm((current) => current ? { ...current, niam: changeEvent.target.value } : current)} placeholder="Opsional" />
              </div>
              <div className="space-y-1.5">
                <Label>Jabatan</Label>
                <Input value={staffForm.role} onChange={(changeEvent) => setStaffForm((current) => current ? { ...current, role: changeEvent.target.value } : current)} placeholder="Ketua Panitia, Bendahara, Registrasi" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={staffForm.unit} onChange={(changeEvent) => setStaffForm((current) => current ? { ...current, unit: changeEvent.target.value } : current)} placeholder="Regional / unit asal" />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStaffForm(null)} disabled={staffSaving}>Batal</Button>
            <Button type="button" className="bg-[#1B4332] text-white hover:bg-[#14532d]" onClick={saveStaff} disabled={staffSaving}>
              {staffSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm text-[#1B4332] font-medium mt-0.5">{value}</p>
      </div>
    </div>
  )
}
