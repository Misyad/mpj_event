'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Send,
  Ticket,
  Upload,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { BadgeStatus } from '@/components/BadgeStatus'
import { PosterUploader } from '@/components/PosterUploader'
import { SpeakerCombobox } from '@/components/SpeakerCombobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { normalizeEvent } from '@/lib/event-api'
import { CertificateTemplateEditor } from '@/components/certificates/CertificateTemplateEditor'
import { DEFAULT_CERTIFICATE_LAYOUT, normalizeCertificateLayout } from '@/components/certificates/certificate-template-layout'
import type { CertificateReusableTemplate, CertificateStatus, CertificateTemplateFieldKey, CertificateTemplateLayout, Event, EventCategory, EventCertificateRecord, EventStatus, Speaker } from '@/types'

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

type EventForm = {
  title: string
  category: EventCategory
  status: EventStatus
  date: string
  time: string
  location: string
  locationMapsUrl: string
  posterUrl: string
  posterFile: File | null
  posterPreview: string
  description: string
  isOpenForPublic: boolean
  isPaid: boolean
  priceNiam: string
  pricePublic: string
  maxParticipants: string
  bankName: string
  bankNumber: string
  bankAccountName: string
  speakerId: string | null
}

type CertificateSummary = {
  event: Event
  settings: {
    enabled: boolean
    templateUrl: string | null
    templateName: string | null
    layout: CertificateTemplateLayout
    generatedCount: number
  }
  certificates: EventCertificateRecord[]
  templates: CertificateReusableTemplate[]
  created?: number
}

type EventManagementClientProps = {
  mode: 'admin-pusat' | 'regional'
  title: string
  subtitle: string
  scopeLabel: string
  createHref?: string
  initialEvents?: Event[]
  regionalId?: string
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu',
  APPROVED: 'Published',
  REJECTED: 'Ditolak',
  LIVE: 'Berjalan',
  FINISHED: 'Selesai',
  COMPLETED: 'Completed',
  draft: 'Draft',
  pending: 'Menunggu',
  approved: 'Published',
  rejected: 'Ditolak',
  registration_closed: 'Pendaftaran Ditutup',
  finished: 'Selesai',
}

const CATEGORY_OPTIONS: EventCategory[] = ['Pelatihan', 'Seremonial', 'Rapat']
const STATUS_OPTIONS: EventStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'LIVE', 'FINISHED', 'COMPLETED', 'draft', 'pending', 'approved', 'rejected', 'registration_closed', 'finished']
const PAGE_SIZE = 8
const EMPTY_FORM: EventForm = {
  title: '',
  category: 'Pelatihan',
  status: 'draft',
  date: '',
  time: '',
  location: '',
  locationMapsUrl: '',
  posterUrl: '',
  posterFile: null,
  posterPreview: '',
  description: '',
  isOpenForPublic: true,
  isPaid: false,
  priceNiam: '0',
  pricePublic: '0',
  maxParticipants: '',
  bankName: '',
  bankNumber: '',
  bankAccountName: '',
  speakerId: null,
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function certificateStatusLabel(status?: CertificateStatus | string | null) {
  if (status === 'revoked') return 'Revoked'
  if (status === 'expired') return 'Expired'
  if (status === 'reissued') return 'Reissued'
  return 'Active'
}

function certificateStatusClass(status?: CertificateStatus | string | null) {
  if (status === 'revoked') return 'border-red-100 bg-red-50 text-red-700'
  if (status === 'expired') return 'border-amber-100 bg-amber-50 text-amber-700'
  if (status === 'reissued') return 'border-blue-100 bg-blue-50 text-blue-700'
  return 'border-emerald-100 bg-emerald-50 text-emerald-700'
}

function getEventQuota(event: Event) {
  return event.max_participants ?? event.quota ?? Math.max(event.registeredCount ?? event.current_participants ?? 0, 1)
}

function getEventDateParts(value?: string) {
  const date = new Date(value ?? '')
  if (Number.isNaN(date.getTime())) return { date: '', time: '' }
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toTimeString().slice(0, 5),
  }
}

function getCrewNeeds(event: Event) {
  if (event.category === 'Pelatihan') return ['Dokumentasi', 'Operator Absensi', 'Liaison Narasumber']
  if (event.category === 'Seremonial') return ['Protokoler', 'Dokumentasi', 'Registrasi']
  return ['Notulen', 'Operator Absensi', 'Koordinator Peserta']
}

function isOpenEvent(event: Event) {
  return event.status_pendaftaran !== 'closed' && !['finished', 'completed', 'FINISHED', 'COMPLETED'].includes(String(event.status))
}

function publicHref(event: Event) {
  return `/events/${encodeURIComponent(event.slug || event.id)}`
}

function registerHref(event: Event) {
  return `/register/${encodeURIComponent(event.slug || event.id)}`
}

function buildForm(event: Event): EventForm {
  const dateParts = getEventDateParts(event.start_date ?? event.dateStart)
  return {
    title: event.title,
    category: event.category,
    status: event.status,
    date: dateParts.date,
    time: dateParts.time,
    location: event.location_name ?? event.location ?? '',
    locationMapsUrl: event.location_gmaps ?? event.locationMapsUrl ?? '',
    posterUrl: event.poster_url ?? event.posterUrl ?? '',
    posterFile: null,
    posterPreview: '',
    description: event.description,
    isOpenForPublic: Boolean(event.is_open_for_public ?? event.allowPublic),
    isPaid: Boolean(event.is_paid ?? event.isPaidEvent),
    priceNiam: String(event.price_niam ?? event.priceNiam ?? 0),
    pricePublic: String(event.price_public ?? event.priceUmum ?? 0),
    maxParticipants: event.max_participants || event.quota ? String(event.max_participants ?? event.quota) : '',
    bankName: event.bank_account?.bank_name ?? '',
    bankNumber: event.bank_account?.account_number ?? '',
    bankAccountName: event.bank_account?.account_name ?? '',
    speakerId: event.speaker_id ?? null,
  }
}

function payloadFromForm(form: EventForm, mode: EventManagementClientProps['mode']) {
  if (!form.title.trim()) throw new Error('Nama event wajib diisi')
  if (!form.date) throw new Error('Tanggal event wajib diisi')
  const startDate = new Date(`${form.date}T${form.time || '00:00'}`)
  const slug = form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return {
    title: form.title,
    slug,
    category: form.category,
    status: mode === 'admin-pusat' ? form.status : undefined,
    poster_url: form.posterUrl || 'https://picsum.photos/seed/mpj-regional-event/800/450',
    posterUrl: form.posterUrl || 'https://picsum.photos/seed/mpj-regional-event/800/450',
    description: form.description,
    location_name: form.location,
    location: form.location,
    location_gmaps: form.locationMapsUrl,
    locationMapsUrl: form.locationMapsUrl,
    start_date: startDate.toISOString(),
    dateStart: startDate.toISOString(),
    is_open_for_public: form.isOpenForPublic,
    allowPublic: form.isOpenForPublic,
    is_paid: form.isPaid,
    isPaidEvent: form.isPaid,
    payment_method: 'manual',
    paymentMethod: 'manual',
    price_niam: Number(form.priceNiam || 0),
    priceNiam: Number(form.priceNiam || 0),
    price_public: Number(form.pricePublic || 0),
    priceUmum: Number(form.pricePublic || 0),
    max_participants: form.maxParticipants ? Number(form.maxParticipants) : null,
    quota: form.maxParticipants ? Number(form.maxParticipants) : null,
    bank_account: {
      bank_name: form.bankName,
      account_number: form.bankNumber,
      account_name: form.bankAccountName,
    },
    speaker_id: form.speakerId,
  }
}

async function uploadPoster(file: File) {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/admin/uploads/poster', {
    method: 'POST',
    body,
  })
  const payload = await response.json()
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || 'Gagal mengupload poster')
  }
  return String(payload.url)
}

export function EventManagementClient({ mode, title, subtitle, scopeLabel, createHref, initialEvents, regionalId }: EventManagementClientProps) {
  const isAdminPusat = mode === 'admin-pusat'
  const [events, setEvents] = useState<Event[]>(initialEvents?.map(normalizeEvent) ?? [])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [isLoading, setIsLoading] = useState(!initialEvents)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [approvalLogs, setApprovalLogs] = useState<Record<string, ApprovalLog[]>>({})
  const [approvalTarget, setApprovalTarget] = useState<{ event: Event; status: 'APPROVED' | 'REJECTED' } | null>(null)
  const [approvalReason, setApprovalReason] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [form, setForm] = useState<EventForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [certificateEvent, setCertificateEvent] = useState<Event | null>(null)
  const [certificateSummary, setCertificateSummary] = useState<CertificateSummary | null>(null)
  const [certificateEnabled, setCertificateEnabled] = useState(false)
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState('')
  const [certificateTemplateName, setCertificateTemplateName] = useState('')
  const [certificateLayout, setCertificateLayout] = useState<CertificateTemplateLayout>(DEFAULT_CERTIFICATE_LAYOUT)
  const [isCertificateLoading, setIsCertificateLoading] = useState(false)
  const [isCertificateSaving, setIsCertificateSaving] = useState(false)
  const [isGeneratingCertificates, setIsGeneratingCertificates] = useState(false)
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false)
  const [certificateStatusUpdatingId, setCertificateStatusUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (initialEvents) return
    let active = true

    async function load() {
      try {
        setIsLoading(true)
        setError('')
        const [eventsResponse, speakersResponse] = await Promise.all([
          fetch('/api/admin/events', { cache: 'no-store' }),
          fetch('/api/admin/speakers', { cache: 'no-store' }),
        ])
        const [eventsPayload, speakersPayload] = await Promise.all([eventsResponse.json(), speakersResponse.json()])
        if (!eventsResponse.ok || !eventsPayload.ok) throw new Error(eventsPayload.error || 'Gagal memuat data event')
        if (!speakersResponse.ok || !speakersPayload.ok) throw new Error(speakersPayload.error || 'Gagal memuat data narasumber')
        const normalizedEvents: Event[] = eventsPayload.data.map(normalizeEvent)
        if (!active) return
        setEvents(normalizedEvents)
        setSpeakers(speakersPayload.data)
        const logEntries = await Promise.all(
          normalizedEvents.map(async (event) => {
            const response = await fetch(`/api/admin/events/${event.id}/approval-logs`, { cache: 'no-store' })
            if (!response.ok) return [event.id, []] as const
            const payload = await response.json()
            return [event.id, payload.ok ? payload.data ?? [] : []] as const
          }),
        )
        if (active) setApprovalLogs(Object.fromEntries(logEntries))
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data event')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [initialEvents])

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch =
        !keyword ||
        event.title.toLowerCase().includes(keyword) ||
        (event.location_name ?? event.location ?? '').toLowerCase().includes(keyword) ||
        event.description.toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
      const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [categoryFilter, events, search, statusFilter])

  const stats = useMemo(() => ({
    total: events.length,
    open: events.filter(isOpenEvent).length,
    published: events.filter((event) => ['approved', 'APPROVED', 'live', 'LIVE'].includes(String(event.status))).length,
    participants: events.reduce((sum, event) => sum + (event.registeredCount ?? event.current_participants ?? 0), 0),
  }), [events])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilter = Boolean(search || statusFilter !== 'ALL' || categoryFilter !== 'ALL')

  function resetFilters() {
    setSearch('')
    setStatusFilter('ALL')
    setCategoryFilter('ALL')
    setPage(1)
  }

  function openCreate() {
    setEditingEvent(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  function openEdit(event: Event) {
    setEditingEvent(event)
    setForm(buildForm(event))
    setError('')
  }

  async function updateEventStatus(eventId: string, status: EventStatus, reason = '') {
    const previous = events
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, status } : event)))

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, approvalReason: reason }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal mengubah status event')
      const updated = normalizeEvent(payload.data)
      setEvents((current) => current.map((event) => (event.id === eventId ? updated : event)))
      if (String(status).toUpperCase() === 'APPROVED' || String(status).toUpperCase() === 'REJECTED') {
        const logsResponse = await fetch(`/api/admin/events/${eventId}/approval-logs`, { cache: 'no-store' })
        const logsPayload = await logsResponse.json()
        if (logsResponse.ok && logsPayload.ok) setApprovalLogs((current) => ({ ...current, [eventId]: logsPayload.data ?? [] }))
      }
    } catch (updateError) {
      setEvents(previous)
      const message = updateError instanceof Error ? updateError.message : 'Gagal mengubah status event'
      setError(message)
      toast.error(message)
    }
  }

  async function confirmApproval() {
    if (!approvalTarget) return
    if (approvalTarget.status === 'REJECTED' && !approvalReason.trim()) {
      setError('Alasan penolakan approval wajib diisi')
      return
    }
    try {
      setIsApproving(true)
      setError('')
      await updateEventStatus(approvalTarget.event.id, approvalTarget.status, approvalReason)
      setApprovalTarget(null)
      setApprovalReason('')
      toast.success(approvalTarget.status === 'APPROVED' ? 'Event berhasil disetujui' : 'Event berhasil ditolak')
    } finally {
      setIsApproving(false)
    }
  }

  async function saveEvent() {
    if (!form) return
    try {
      setIsSaving(true)
      setError('')
      const posterUrl = form.posterFile ? await uploadPoster(form.posterFile) : form.posterUrl
      const eventPayload = payloadFromForm({ ...form, posterUrl }, mode)
      const endpoint = isAdminPusat
        ? `/api/admin/events/${editingEvent?.id}`
        : editingEvent
          ? `/api/regional/events/${editingEvent.id}`
          : '/api/regional/events'
      const response = await fetch(endpoint, {
        method: editingEvent ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(eventPayload),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan event')
      const updated = normalizeEvent(payload.data)
      setEvents((current) => editingEvent ? current.map((event) => event.id === updated.id ? updated : event) : [updated, ...current])
      setEditingEvent(null)
      setForm(null)
      toast.success(editingEvent ? 'Event berhasil diperbarui' : 'Event berhasil dibuat')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Gagal menyimpan event'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function runRegionalAction(event: Event, action: 'submit' | 'archive') {
    try {
      setError('')
      const response = await fetch(`/api/regional/events/${event.id}/${action}`, { method: 'POST' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Aksi event gagal')
      const updated = normalizeEvent(payload.data)
      setEvents((current) => current.map((item) => item.id === event.id ? updated : item))
      toast.success(action === 'submit' ? 'Event berhasil diajukan' : 'Event berhasil diarsipkan')
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Aksi event gagal'
      setError(message)
      toast.error(message)
    }
  }

  function applyCertificateSummary(summary: CertificateSummary) {
    setCertificateSummary(summary)
    setCertificateEnabled(summary.settings.enabled)
    setCertificateTemplateUrl(summary.settings.templateUrl ?? '')
    setCertificateTemplateName(summary.settings.templateName ?? '')
    setCertificateLayout(normalizeCertificateLayout(summary.settings.layout))
    setEvents((current) => current.map((event) => event.id === summary.event.id ? normalizeEvent(summary.event) : event))
  }

  async function openCertificateModal(event: Event) {
    setCertificateEvent(event)
    setCertificateSummary(null)
    setCertificateEnabled(Boolean(event.certificateEnabled))
    setCertificateTemplateUrl(event.certificateTemplateUrl ?? '')
    setCertificateTemplateName(event.certificateTemplateName ?? '')
    setCertificateLayout(normalizeCertificateLayout(event.certificateLayout ?? DEFAULT_CERTIFICATE_LAYOUT))
    try {
      setIsCertificateLoading(true)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(event.id)}/certificates`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat pengaturan sertifikat')
      applyCertificateSummary(payload.data)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan sertifikat'
      setError(message)
      toast.error(message)
    } finally {
      setIsCertificateLoading(false)
    }
  }

  async function saveCertificateSettings(nextEnabled = certificateEnabled, saveReusable = false) {
    if (!certificateEvent) return
    try {
      setIsCertificateSaving(true)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(certificateEvent.id)}/certificates`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: nextEnabled,
          templateUrl: certificateTemplateUrl || null,
          templateName: certificateTemplateName || null,
          layout: certificateLayout,
          saveReusable,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan pengaturan sertifikat')
      applyCertificateSummary(payload.data)
      toast.success('Pengaturan sertifikat disimpan')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Gagal menyimpan pengaturan sertifikat'
      setError(message)
      toast.error(message)
    } finally {
      setIsCertificateSaving(false)
    }
  }

  async function uploadCertificateTemplate(file: File | null) {
    if (!file || !certificateEvent) return
    try {
      setIsUploadingTemplate(true)
      setError('')
      const formData = new FormData()
      formData.set('file', file)
      formData.set('eventId', certificateEvent.id)
      const response = await fetch('/api/admin/uploads/certificate-template', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal upload template sertifikat')
      setCertificateTemplateUrl(payload.url)
      setCertificateTemplateName(payload.name ?? file.name)
      toast.success('Template sertifikat berhasil diupload')
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Gagal upload template sertifikat'
      setError(message)
      toast.error(message)
    } finally {
      setIsUploadingTemplate(false)
    }
  }

  async function generateCertificates() {
    if (!certificateEvent) return
    try {
      setIsGeneratingCertificates(true)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(certificateEvent.id)}/certificates`, { method: 'POST' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal generate sertifikat')
      applyCertificateSummary(payload.data)
      toast.success(`${payload.data.created ?? 0} sertifikat baru digenerate`)
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : 'Gagal generate sertifikat'
      setError(message)
      toast.error(message)
    } finally {
      setIsGeneratingCertificates(false)
    }
  }

  async function updateCertificateStatus(certificate: EventCertificateRecord, status: CertificateStatus) {
    if (!certificateEvent) return
    const reason = status === 'revoked' ? window.prompt('Alasan revoke sertifikat ini?') : ''
    if (status === 'revoked' && reason === null) return

    try {
      setCertificateStatusUpdatingId(certificate.id)
      setError('')
      const response = await fetch(`/api/admin/events/${encodeURIComponent(certificateEvent.id)}/certificates/${encodeURIComponent(certificate.id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, reason: reason?.trim() || null }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal mengubah status sertifikat')
      setCertificateSummary((current) => current
        ? {
            ...current,
            certificates: current.certificates.map((item) => item.id === certificate.id ? payload.data : item),
          }
        : current)
      toast.success(`Sertifikat ${certificateStatusLabel(status).toLowerCase()}`)
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : 'Gagal mengubah status sertifikat'
      setError(message)
      toast.error(message)
    } finally {
      setCertificateStatusUpdatingId(null)
    }
  }

  function certificatePreviewData(event: Event): Record<CertificateTemplateFieldKey, string> {
    const sampleCode = certificateSummary?.certificates[0]?.verificationCode || 'MPJ-CERT-8F2KQ9XW7A'
    return {
      certificate_number: certificateSummary?.certificates[0]?.certificateNumber || `MPJ-CERT-${event.id.slice(0, 8).toUpperCase()}-0001`,
      participant_name: certificateSummary?.certificates[0]?.participantName || 'Nama Peserta Contoh',
      event_name: event.title,
      role: 'Panitia Event',
      signer_name: 'Ketua Panitia',
      date: formatDate(event.start_date ?? event.dateStart),
      qr_code: `${typeof window === 'undefined' ? '' : window.location.origin}/verify/certificate/${encodeURIComponent(sampleCode)}`,
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7F5] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{scopeLabel}</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332] md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-gray-600">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{stats.total} Event</span>
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{stats.open} Pendaftaran Aktif</span>
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{stats.published} Published</span>
              {regionalId ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 shadow-sm">{regionalId}</span> : null}
            </div>
          </div>
          {isAdminPusat && createHref ? (
            <Link href={createHref}>
              <Button className="rounded-xl bg-[#1B4332] text-white hover:bg-[#14532d]">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          ) : (
            <Button type="button" onClick={openCreate} className="rounded-xl bg-[#1B4332] text-white hover:bg-[#14532d]">
              <Plus className="h-4 w-4" />
              Buat Event
            </Button>
          )}
        </div>

        {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Total Event" value={stats.total} icon={<CalendarDays className="h-4 w-4 text-[#1B4332]" />} />
          <StatCard label="Pendaftaran Aktif" value={stats.open} icon={<Ticket className="h-4 w-4 text-indigo-600" />} />
          <StatCard label="Published" value={stats.published} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
          <StatCard label="Peserta" value={stats.participants} icon={<UsersRound className="h-4 w-4 text-amber-600" />} />
        </div>

        {isAdminPusat ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <ApprovalStep title="1. Review" description="Cek data event, harga, kuota, narasumber, dan kebutuhan crew sebelum keputusan." />
            <ApprovalStep title="2. Approve" description="Status menjadi Published, event siap tampil di publik dan pendaftaran aktif bila jalurnya dibuka." />
            <ApprovalStep title="3. Tolak" description="Status menjadi Ditolak, event tidak publish dan alasan tersimpan di riwayat approval." />
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="h-10 rounded-xl border-gray-200 bg-white pl-9"
              placeholder="Cari judul, lokasi, atau deskripsi event..."
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as EventStatus | 'ALL')
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua status</SelectItem>
              {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status] ?? status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value as EventCategory | 'ALL')
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua kategori</SelectItem>
              {CATEGORY_OPTIONS.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilter ? (
            <button type="button" onClick={resetFilters} className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 transition-colors hover:text-red-500">
              Reset
            </button>
          ) : null}
        </div>

        <p className="text-xs text-gray-500">
          Menampilkan <span className="font-bold text-[#1B4332]">{filteredEvents.length}</span> dari {events.length} event
          {hasFilter ? <span className="font-semibold text-[#1B4332]"> (difilter)</span> : null}
        </p>

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => <EventSkeleton key={index} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <Ticket className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[#1B4332]">Belum ada event yang cocok</h2>
            <p className="mt-1 text-sm text-gray-500">Coba ubah keyword atau filter untuk menemukan data event.</p>
            {!hasFilter && !isAdminPusat ? <Button type="button" onClick={openCreate} className="mt-5 rounded-xl bg-[#1B4332] text-white">Buat event pertama</Button> : null}
          </div>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              {pagedEvents.map((event) => {
                const participantCount = event.registeredCount ?? event.current_participants ?? 0
                const quota = getEventQuota(event)
                const quotaPercent = Math.min(100, Math.round((participantCount / Math.max(quota, 1)) * 100))
                const eventSpeakers = speakers.filter((speaker) => speaker.id === event.speaker_id)
                const readOnly = ['FINISHED', 'COMPLETED', 'finished', 'completed'].includes(String(event.status))
                const regionalEditable = ['draft', 'rejected'].includes(String(event.status).toLowerCase())
                const latestApprovalLog = approvalLogs[event.id]?.[0]

                return (
                  <Card key={event.id} className="overflow-hidden rounded-3xl border-gray-100 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="relative h-48 w-full overflow-hidden bg-emerald-50">
                      <Image src={event.poster_url || event.posterUrl || 'https://picsum.photos/seed/mpj-event/800/450'} alt={event.title} fill sizes="(max-width: 1280px) 100vw, 50vw" className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                        <BadgeStatus status={event.status} />
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-[#1B4332]">{event.category}</span>
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{event.is_open_for_public ? 'Umum' : 'Internal'}</span>
                      </div>
                    </div>
                    <CardContent className="space-y-4 p-5">
                      <div>
                        <h2 className="text-lg font-extrabold text-[#1B4332]">{event.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{event.description}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoTile icon={<CalendarDays className="h-4 w-4 text-emerald-700" />} label="Jadwal" value={formatDate(event.start_date ?? event.dateStart)} />
                        <InfoTile icon={<MapPin className="h-4 w-4 text-emerald-700" />} label="Lokasi" value={event.location_name ?? event.location ?? '-'} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#1B4332]">Kuota Peserta</span>
                          <span className="text-gray-500">{participantCount}/{quota}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${quotaPercent}%` }} />
                        </div>
                        {participantCount >= quota ? <p className="text-xs font-semibold text-red-600">Kuota penuh. Jalur pendaftaran perlu ditutup.</p> : null}
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{isAdminPusat ? 'Approval Pusat' : 'Status Pengajuan'}</p>
                            <p className="mt-1 text-sm font-semibold text-[#1B4332]">
                              {String(event.status).toUpperCase() === 'APPROVED'
                                ? 'Disetujui dan siap publikasi'
                                : String(event.status).toUpperCase() === 'REJECTED'
                                  ? 'Ditolak, menunggu revisi'
                                  : String(event.status).toUpperCase() === 'PENDING'
                                    ? 'Menunggu keputusan pusat'
                                    : 'Belum masuk approval aktif'}
                            </p>
                          </div>
                          <History className="h-4 w-4 shrink-0 text-amber-700" />
                        </div>
                        {isAdminPusat && latestApprovalLog ? (
                          <p className="mt-2 text-xs text-gray-600">
                            Terakhir: {latestApprovalLog.actorName ?? latestApprovalLog.actorEmail ?? 'Admin'} - {new Date(latestApprovalLog.createdAt).toLocaleString('id-ID')}
                            {latestApprovalLog.metadata?.reason ? ` - ${latestApprovalLog.metadata.reason}` : ''}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-gray-500">{isAdminPusat ? 'Belum ada riwayat approval.' : 'Regional hanya dapat mengajukan, merevisi, dan mengarsipkan event miliknya.'}</p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryBox label="Pricing" value={event.is_paid ? `${formatCurrency(event.price_niam)} / ${formatCurrency(event.price_public)}` : 'Gratis'} />
                        <SummaryBox label="Narasumber" value={eventSpeakers.length > 0 ? eventSpeakers.map((speaker) => speaker.nama_lengkap).join(', ') : 'Belum dipilih'} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryBox label="Sertifikat" value={event.certificateEnabled ? 'Aktif' : 'Nonaktif'} />
                        <SummaryBox label="Generated" value={`${event.certificateGeneratedCount ?? 0} sertifikat`} />
                      </div>

                      <div className="rounded-2xl border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Kebutuhan Crew</p>
                        <p className="mt-1 text-sm font-semibold text-[#1B4332]">{getCrewNeeds(event).join(', ')}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Link href={isAdminPusat ? `/admin-pusat/events/${event.id}` : publicHref(event)}>
                          <Button variant="outline" className="w-full rounded-xl sm:w-auto">
                            <Eye className="h-4 w-4" />
                            {isAdminPusat ? 'View Detail' : 'Lihat Publik'}
                          </Button>
                        </Link>
                        <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto" disabled={isAdminPusat ? readOnly : !regionalEditable} onClick={() => openEdit(event)}>
                          <Pencil className="h-4 w-4" />
                          Edit Event
                        </Button>
                        <Button type="button" variant="outline" className="w-full rounded-xl border-amber-100 text-[#8a6d16] hover:bg-amber-50 sm:w-auto" onClick={() => openCertificateModal(event)}>
                          <Award className="h-4 w-4" />
                          Sertifikat
                        </Button>
                        {isAdminPusat ? (
                          <>
                            <Select
                              value={event.status}
                              onValueChange={(value) => {
                                if (value === 'REJECTED') {
                                  setApprovalTarget({ event, status: 'REJECTED' })
                                  return
                                }
                                if (value === 'APPROVED' && event.status === 'PENDING') {
                                  setApprovalTarget({ event, status: 'APPROVED' })
                                  return
                                }
                                updateEventStatus(event.id, value as EventStatus)
                              }}
                              disabled={readOnly}
                            >
                              <SelectTrigger className="h-9 rounded-xl sm:w-[180px]">
                                <SelectValue placeholder="Ganti status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status] ?? status}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {event.status === 'PENDING' ? (
                              <>
                                <Button type="button" className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto" onClick={() => setApprovalTarget({ event, status: 'APPROVED' })}>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button type="button" variant="outline" className="w-full rounded-xl border-red-100 text-red-600 hover:bg-red-50 sm:w-auto" onClick={() => setApprovalTarget({ event, status: 'REJECTED' })}>
                                  <XCircle className="h-4 w-4" />
                                  Tolak
                                </Button>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {regionalEditable ? (
                              <Button type="button" onClick={() => runRegionalAction(event, 'submit')} className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto">
                                <Send className="h-4 w-4" />
                                Ajukan
                              </Button>
                            ) : null}
                            {!['approved', 'live', 'finished', 'completed'].includes(String(event.status).toLowerCase()) ? (
                              <Button type="button" variant="outline" onClick={() => runRegionalAction(event, 'archive')} className="w-full rounded-xl border-red-100 text-red-600 hover:bg-red-50 sm:w-auto">
                                <Archive className="h-4 w-4" />
                                Arsipkan
                              </Button>
                            ) : null}
                            {isOpenEvent(event) ? (
                              <Link href={registerHref(event)}>
                                <Button className="w-full rounded-xl bg-[#1B4332] text-white hover:bg-[#14532d] sm:w-auto">
                                  <Ticket className="h-4 w-4" />
                                  Link Registrasi
                                </Button>
                              </Link>
                            ) : null}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-sm text-gray-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span>Halaman {currentPage} dari {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="rounded-xl" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" disabled={currentPage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={Boolean(certificateEvent)} onOpenChange={(open) => {
        if (!open) {
          setCertificateEvent(null)
          setCertificateSummary(null)
        }
      }}>
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Kelola Sertifikat Event</DialogTitle>
            <DialogDescription>
              Aktifkan sertifikat, upload template, lalu generate sertifikat peserta yang sudah hadir.
            </DialogDescription>
          </DialogHeader>
          {certificateEvent ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-extrabold text-[#1B4332]">{certificateEvent.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {certificateSummary?.settings.generatedCount ?? certificateEvent.certificateGeneratedCount ?? 0} sertifikat generated
                  {certificateSummary?.settings.templateName || certificateEvent.certificateTemplateName ? ` - Template: ${certificateSummary?.settings.templateName ?? certificateEvent.certificateTemplateName}` : ''}
                </p>
              </div>

              {isCertificateLoading ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm font-semibold text-gray-500">
                  <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Memuat pengaturan sertifikat...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4">
                    <div>
                      <p className="text-sm font-bold text-[#1B4332]">Aktifkan Sertifikat</p>
                      <p className="text-xs text-gray-500">Peserta hanya bisa membuka sertifikat setelah fitur aktif dan sertifikat digenerate.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={certificateEnabled}
                        onChange={(event) => {
                          setCertificateEnabled(event.target.checked)
                          saveCertificateSettings(event.target.checked)
                        }}
                        className="peer sr-only"
                      />
                      <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#1B4332] peer-checked:after:translate-x-5" />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600">Template Sertifikat</Label>
                      <Input value={certificateTemplateUrl} onChange={(event) => setCertificateTemplateUrl(event.target.value)} className="h-10 rounded-xl" placeholder="/uploads/certificate-templates/template.png" />
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 self-end rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-600 transition-colors hover:border-[#1B4332] hover:text-[#1B4332]">
                      {isUploadingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                      <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(event) => uploadCertificateTemplate(event.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <Input value={certificateTemplateName} onChange={(event) => setCertificateTemplateName(event.target.value)} className="h-10 rounded-xl" placeholder="Nama template sertifikat" />

                  {certificateSummary?.templates.length ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600">Template Reusable</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const template = certificateSummary.templates.find((item) => item.id === value)
                          if (!template) return
                          setCertificateTemplateUrl(template.templateUrl ?? '')
                          setCertificateTemplateName(template.name)
                          setCertificateLayout(normalizeCertificateLayout(template.layout))
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih template tersimpan" /></SelectTrigger>
                        <SelectContent>
                          {certificateSummary.templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-gray-100 bg-white p-3">
                    <div className="mb-3">
                      <p className="text-sm font-bold text-[#1B4332]">Editor Koordinat Template</p>
                      <p className="text-xs text-gray-500">Drag elemen di preview atau atur X, Y, width, font, warna, dan alignment secara manual.</p>
                    </div>
                    <CertificateTemplateEditor
                      templateUrl={certificateTemplateUrl}
                      layout={certificateLayout}
                      onChange={setCertificateLayout}
                      previewData={certificatePreviewData(certificateEvent)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => saveCertificateSettings()} disabled={isCertificateSaving}>
                      {isCertificateSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Simpan Setting
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl border-amber-100 text-[#8a6d16] hover:bg-amber-50" onClick={() => saveCertificateSettings(certificateEnabled, true)} disabled={isCertificateSaving || !certificateTemplateName.trim()}>
                      Simpan Template Reusable
                    </Button>
                    </div>
                    <Button type="button" className="rounded-xl bg-[#1B4332] text-white hover:bg-[#14532d]" onClick={generateCertificates} disabled={isGeneratingCertificates || !certificateEnabled}>
                      {isGeneratingCertificates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                      Generate Sertifikat Peserta
                    </Button>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-2xl border border-gray-100">
                    {certificateSummary?.certificates.length ? (
                      <div className="divide-y divide-gray-100">
                        {certificateSummary.certificates.map((certificate) => (
                          <div key={certificate.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-[#1B4332]">{certificate.participantName}</p>
                                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${certificateStatusClass(certificate.status)}`}>
                                  {certificateStatusLabel(certificate.status)}
                                </span>
                              </div>
                              <p className="font-mono text-xs text-gray-500">{certificate.certificateNumber}</p>
                              {certificate.revokedReason ? <p className="mt-1 text-xs font-medium text-red-600">Alasan: {certificate.revokedReason}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {certificate.verificationCode ? (
                                <Link href={`/certificate/${encodeURIComponent(certificate.verificationCode)}`} target="_blank">
                                  <Button type="button" variant="outline" className="h-8 rounded-lg text-xs">Preview</Button>
                                </Link>
                              ) : null}
                              <Link href={certificate.generatedFileUrl || (certificate.verificationCode ? `/certificate/${encodeURIComponent(certificate.verificationCode)}` : '#')} target="_blank">
                                <Button type="button" className="h-8 rounded-lg bg-[#1B4332] text-xs text-white" disabled={!certificate.generatedFileUrl && !certificate.verificationCode}>Download</Button>
                              </Link>
                              {certificate.status === 'active' ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 rounded-lg border-red-100 text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => updateCertificateStatus(certificate, 'revoked')}
                                  disabled={certificateStatusUpdatingId === certificate.id}
                                >
                                  {certificateStatusUpdatingId === certificate.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                  Revoke
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm font-semibold text-gray-500">Belum ada sertifikat generated.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCertificateEvent(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(approvalTarget)} onOpenChange={(open) => {
        if (!open) {
          setApprovalTarget(null)
          setApprovalReason('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approvalTarget?.status === 'APPROVED' ? 'Approve Event?' : 'Tolak Approval Event?'}</DialogTitle>
            <DialogDescription>
              {approvalTarget?.status === 'APPROVED' ? 'Event akan menjadi Published dan dapat tampil di publik sesuai pengaturan event.' : 'Event akan berstatus Ditolak dan alasan penolakan tersimpan di riwayat approval.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#1B4332]">{approvalTarget?.event.title}</p>
            {approvalTarget?.status === 'REJECTED' ? (
              <div className="space-y-1.5">
                <Label>Alasan Penolakan</Label>
                <Textarea value={approvalReason} onChange={(event) => setApprovalReason(event.target.value)} placeholder="Tuliskan revisi yang perlu dilakukan..." />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApprovalTarget(null)} disabled={isApproving}>Batal</Button>
            <Button type="button" className={approvalTarget?.status === 'APPROVED' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'} onClick={confirmApproval} disabled={isApproving}>
              {isApproving ? 'Memproses...' : approvalTarget?.status === 'APPROVED' ? 'Approve' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(form)} onOpenChange={(open) => {
        if (!open && !isSaving) {
          setEditingEvent(null)
          setForm(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Buat Event Regional'}</DialogTitle>
            <DialogDescription>{isAdminPusat ? 'Perbarui data event existing tanpa membuat event baru.' : 'Event regional tersimpan sebagai draft lalu diajukan ke Admin Pusat untuk approval.'}</DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Nama Event</Label>
                <Input value={form.title} onChange={(event) => setForm((current) => current ? { ...current, title: event.target.value } : current)} className="h-10 rounded-xl" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Kategori</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((current) => current ? { ...current, category: value as EventCategory } : current)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Kategori" /></SelectTrigger>
                    <SelectContent>{CATEGORY_OPTIONS.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {isAdminPusat ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Status</Label>
                    <Select value={form.status} onValueChange={(value) => setForm((current) => current ? { ...current, status: value as EventStatus } : current)}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status] ?? status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Kuota</Label>
                    <Input type="number" min="1" value={form.maxParticipants} onChange={(event) => setForm((current) => current ? { ...current, maxParticipants: event.target.value } : current)} className="h-10 rounded-xl" placeholder="Tidak dibatasi" />
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Tanggal</Label>
                  <Input type="date" value={form.date} onChange={(event) => setForm((current) => current ? { ...current, date: event.target.value } : current)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Jam</Label>
                  <Input type="time" value={form.time} onChange={(event) => setForm((current) => current ? { ...current, time: event.target.value } : current)} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Lokasi</Label>
                  <Input value={form.location} onChange={(event) => setForm((current) => current ? { ...current, location: event.target.value } : current)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Google Maps</Label>
                  <Input value={form.locationMapsUrl} onChange={(event) => setForm((current) => current ? { ...current, locationMapsUrl: event.target.value } : current)} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Poster Event</Label>
                <PosterUploader
                  key={`${editingEvent?.id ?? 'new'}-${form.posterUrl || 'empty'}`}
                  currentUrl={form.posterPreview || form.posterUrl}
                  onFileSelect={(file, previewUrl) => {
                    setForm((current) => current ? { ...current, posterFile: file, posterPreview: previewUrl } : current)
                  }}
                  onClear={() => {
                    setForm((current) => current ? { ...current, posterFile: null, posterPreview: '', posterUrl: '' } : current)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Deskripsi</Label>
                <Textarea value={form.description} onChange={(event) => setForm((current) => current ? { ...current, description: event.target.value } : current)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Narasumber Utama</Label>
                <SpeakerCombobox
                  value={form.speakerId ?? undefined}
                  onChange={(speakerId) => setForm((current) => current ? { ...current, speakerId } : current)}
                  placeholder="Pilih narasumber"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {isAdminPusat ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Kuota</Label>
                    <Input type="number" min="1" value={form.maxParticipants} onChange={(event) => setForm((current) => current ? { ...current, maxParticipants: event.target.value } : current)} className="h-10 rounded-xl" placeholder="Tidak dibatasi" />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Harga NIAM</Label>
                  <Input type="number" min="0" value={form.priceNiam} onChange={(event) => setForm((current) => current ? { ...current, priceNiam: event.target.value } : current)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Harga Umum</Label>
                  <Input type="number" min="0" value={form.pricePublic} onChange={(event) => setForm((current) => current ? { ...current, pricePublic: event.target.value } : current)} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-[#1B4332]">
                  Jalur umum
                  <input type="checkbox" checked={form.isOpenForPublic} onChange={(event) => setForm((current) => current ? { ...current, isOpenForPublic: event.target.checked } : current)} />
                </label>
                <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-[#1B4332]">
                  Event berbayar
                  <input type="checkbox" checked={form.isPaid} onChange={(event) => setForm((current) => current ? { ...current, isPaid: event.target.checked } : current)} />
                </label>
              </div>
              {form.isPaid ? (
                <div className="grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Bank</Label>
                    <Input value={form.bankName} onChange={(event) => setForm((current) => current ? { ...current, bankName: event.target.value } : current)} className="h-10 rounded-xl bg-white" placeholder="BCA" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Nomor Rekening</Label>
                    <Input value={form.bankNumber} onChange={(event) => setForm((current) => current ? { ...current, bankNumber: event.target.value } : current)} className="h-10 rounded-xl bg-white" placeholder="1234567890" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Atas Nama</Label>
                    <Input value={form.bankAccountName} onChange={(event) => setForm((current) => current ? { ...current, bankAccountName: event.target.value } : current)} className="h-10 rounded-xl bg-white" placeholder="MPJ Indonesia" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setEditingEvent(null)
              setForm(null)
            }} disabled={isSaving}>Batal</Button>
            <Button type="button" className="bg-[#1B4332] text-white hover:bg-[#14532d]" onClick={saveEvent} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingEvent ? 'Simpan' : 'Simpan Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">{icon}</div>
      <p className="mt-3 text-xs font-semibold text-gray-400">{label}</p>
      <p className="text-2xl font-extrabold text-[#1B4332]">{value}</p>
    </div>
  )
}

function ApprovalStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-extrabold text-[#1B4332]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
    </div>
  )
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-sm font-semibold text-[#1B4332]">{value}</p>
      </div>
    </div>
  )
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#1B4332]">{value}</p>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-gray-100" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-14 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-14 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  )
}
