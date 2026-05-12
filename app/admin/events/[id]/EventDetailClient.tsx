'use client'

import { use, useEffect, useState } from 'react'
import Image from 'next/image'
import { getStaffByEvent } from '@/lib/dummy'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Award, Building2, Calendar, CheckCircle, CreditCard, ExternalLink, Info, Loader2, MapPin, QrCode, ScanLine, Users } from 'lucide-react'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { normalizeEvent } from '@/lib/event-api'
import type { Event, Participant, PaymentRecord } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PENDING: 'Menunggu Approval', APPROVED: 'Disetujui',
  LIVE: 'Live', FINISHED: 'Selesai', COMPLETED: 'Completed',
  draft: 'Draft', pending: 'Menunggu Approval', approved: 'Disetujui',
  registration_closed: 'Pendaftaran Ditutup', finished: 'Selesai',
}
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700', LIVE: 'bg-green-100 text-green-700',
  FINISHED: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-gray-100 text-gray-600', pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700', registration_closed: 'bg-red-100 text-red-600',
  finished: 'bg-purple-100 text-purple-700',
}
const PAYMENT_COLORS: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-500', Unpaid: 'bg-red-100 text-red-600',
  Pending_Approval: 'bg-amber-100 text-amber-700', Paid: 'bg-emerald-100 text-emerald-700',
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
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

export default function EventDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const staff = getStaffByEvent(id)
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadEvent() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch(`/api/admin/events/${encodeURIComponent(id)}`, { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat detail event')

        const loadedEvent = normalizeEvent(payload.data)
        if (!active) return
        setEvent(loadedEvent)
        setParticipants(payload.participants ?? [])
        setPayments(payload.payments ?? [])
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
      setPayments((current) => current.map((payment) => (
        payment.participant_id === updated.id ? { ...payment, status: updated.payment_status, verified_at: new Date().toISOString() } : payment
      )))
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Gagal confirm peserta')
    } finally {
      setConfirmingId(null)
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
        <Link href="/admin/events"><Button variant="outline" className="mt-4 rounded-xl">← Kembali</Button></Link>
      </div>
    )
  }

  const attendedCount = participants.filter(p => p.attendance_status === 'Attended').length
  const paidCount = payments.filter(p => p.status === 'Paid').length
  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0)
  const eventCompleted = ['finished', 'completed'].includes(String(event.status).toLowerCase())

  return (
    <div className="p-4 md:p-8 space-y-5">
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/events">
          <button className="mt-1 p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-extrabold text-[#1B4332] line-clamp-2">{event.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
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
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image src={event.poster_url} alt={event.title} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={<Calendar className="w-4 h-4 text-[#C9A227]" />} label="Tanggal" value={formatDate(event.start_date)} />
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
              <Button size="sm" className="bg-[#1B4332] hover:bg-[#14532d] text-white rounded-xl text-xs h-8">+ Tambah</Button>
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
                </TableRow></TableHeader>
                <TableBody>
                  {staff.map(s => (
                    <TableRow key={s.id} className="hover:bg-green-50/40">
                      <TableCell className="font-semibold text-[#1B4332] text-sm">{s.full_name}</TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">{s.niam}</TableCell>
                      <TableCell><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{s.role}</span></TableCell>
                      <TableCell className="text-sm text-gray-600">{s.unit}</TableCell>
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
                            <Link href={`/certificate/${encodeURIComponent(p.ticketCode || p.qr_token)}`} className="inline-flex items-center gap-1 rounded-lg border border-[#C9A227]/50 px-2.5 py-1 text-xs font-semibold text-[#8a6d16] transition-colors hover:bg-amber-50">
                              <Award className="h-3 w-3" />
                              Sertifikat
                            </Link>
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
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{paidCount}</p>
                <p className="text-xs text-gray-400 mt-1">Sudah Bayar</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-amber-600">{payments.filter(p => p.status === 'Pending_Approval').length}</p>
                <p className="text-xs text-gray-400 mt-1">Menunggu Verif</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-lg font-extrabold text-[#1B4332]">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1">Total Pendapatan</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-bold text-[#1B4332] text-sm">Log Pembayaran</p>
              </div>
              {payments.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">Belum ada data pembayaran.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow className="bg-gray-50">
                    <TableHead className="font-bold text-[#1B4332]">Peserta</TableHead>
                    <TableHead className="font-bold text-[#1B4332]">Jalur</TableHead>
                    <TableHead className="font-bold text-[#1B4332]">Nominal</TableHead>
                    <TableHead className="font-bold text-[#1B4332]">Status</TableHead>
                    <TableHead className="font-bold text-[#1B4332]">Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {payments.map(pay => (
                      <TableRow key={pay.id} className="hover:bg-green-50/40">
                        <TableCell className="font-semibold text-[#1B4332] text-sm">{pay.participant_name}</TableCell>
                        <TableCell><span className={`text-xs font-semibold px-2 py-1 rounded-full ${pay.path === 'NIAM' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{pay.path}</span></TableCell>
                        <TableCell className="font-mono text-sm text-gray-700">{formatCurrency(pay.amount)}</TableCell>
                        <TableCell><span className={`text-xs font-semibold px-2 py-1 rounded-full ${PAYMENT_COLORS[pay.status]}`}>{pay.status}</span></TableCell>
                        <TableCell>
                          {pay.status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => confirmParticipant(pay.participant_id)}
                              disabled={confirmingId === pay.participant_id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {confirmingId === pay.participant_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Confirm
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
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
                {['DRAFT', 'PENDING', 'APPROVED', 'FINISHED', 'COMPLETED'].map(s => (
                  <button key={s} className={`text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-colors ${event.status === s ? 'border-[#1B4332] bg-[#1B4332] text-white' : 'border-gray-200 text-gray-600 hover:border-[#1B4332] hover:text-[#1B4332]'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-[#1B4332] hover:bg-[#14532d] text-white rounded-xl">Simpan Perubahan</Button>
          </div>
        </TabsContent>
      </Tabs>
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
