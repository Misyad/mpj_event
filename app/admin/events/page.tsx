'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { BadgeStatus } from '@/components/BadgeStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dummyParticipants, dummySpeakers } from '@/lib/dummy'
import { normalizeEvent } from '@/lib/event-api'
import type { Event, EventCategory, EventStatus } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu',
  APPROVED: 'Published',
  LIVE: 'Ongoing',
  FINISHED: 'Selesai',
  COMPLETED: 'Completed',
  draft: 'Draft',
  pending: 'Menunggu',
  approved: 'Published',
  registration_closed: 'Pendaftaran Ditutup',
  finished: 'Selesai',
}

const CATEGORY_OPTIONS: EventCategory[] = ['Pelatihan', 'Seremonial', 'Rapat']
const STATUS_OPTIONS: EventStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'LIVE', 'FINISHED', 'COMPLETED']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getEventQuota(event: Event, participantCount: number) {
  return event.max_participants ?? Math.max(participantCount, 1)
}

function getEventSpeakers(event: Event) {
  return dummySpeakers.filter((speaker) => speaker.id === event.speaker_id)
}

function getCrewNeeds(event: Event) {
  if (event.category === 'Pelatihan') return ['Dokumentasi', 'Operator Absensi', 'Liaison Narasumber']
  if (event.category === 'Seremonial') return ['Protokoler', 'Dokumentasi', 'Registrasi']
  return ['Notulen', 'Operator Absensi', 'Koordinator Peserta']
}

export default function MasterEventPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'ALL'>('ALL')

  useEffect(() => {
    let active = true

    async function loadEvents() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch('/api/admin/events', { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || 'Gagal memuat data event')
        }

        if (active) {
          setEvents(payload.data.map(normalizeEvent))
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data event')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [])

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch =
        !keyword ||
        event.title.toLowerCase().includes(keyword) ||
        event.location_name.toLowerCase().includes(keyword) ||
        event.description.toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
      const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [categoryFilter, events, search, statusFilter])

  async function updateEventStatus(eventId: string, status: EventStatus) {
    const previous = events
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, status } : event)))

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Gagal mengubah status event')
      }

      setEvents((current) => current.map((event) => (event.id === eventId ? normalizeEvent(payload.data) : event)))
    } catch (updateError) {
      setEvents(previous)
      setError(updateError instanceof Error ? updateError.message : 'Gagal mengubah status event')
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332]">Kelola Event</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lifecycle event Admin Pusat dari daftar event hingga publikasi.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="bg-[#1B4332] hover:bg-[#14532d] text-white rounded-xl">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="h-auto w-full justify-start flex-wrap rounded-2xl bg-gray-100 p-1">
          <TabsTrigger value="events" className="rounded-xl px-4 py-2">Daftar Event</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-5 space-y-5">
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 rounded-xl pl-9"
                placeholder="Cari judul, lokasi, atau deskripsi event..."
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | 'ALL')}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as EventCategory | 'ALL')}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua kategori</SelectItem>
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
              Memuat data event...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
              Belum ada event yang cocok. Coba ubah keyword atau filter.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredEvents.map((event) => {
                const participantCount = dummyParticipants.filter((participant) => participant.event_id === event.id).length
                const quota = getEventQuota(event, participantCount)
                const quotaPercent = Math.min(100, Math.round((participantCount / Math.max(quota, 1)) * 100))
                const speakers = getEventSpeakers(event)
                const readOnly = event.status === 'FINISHED' || event.status === 'COMPLETED'

                return (
                  <Card key={event.id} className="overflow-hidden rounded-2xl border-gray-100 bg-white py-0 shadow-sm">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image src={event.poster_url} alt={event.title} fill sizes="(max-width: 1280px) 100vw, 50vw" className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                        <BadgeStatus status={event.status} />
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-[#1B4332]">
                          {event.category}
                        </span>
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                          {event.is_open_for_public ? 'Umum' : 'Internal'}
                        </span>
                      </div>
                    </div>
                    <CardContent className="space-y-4 p-5">
                      <div>
                        <h2 className="text-lg font-bold text-[#1B4332]">{event.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{event.description}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoTile icon={<CalendarDays className="h-4 w-4 text-emerald-700" />} label="Jadwal" value={formatDate(event.start_date)} />
                        <InfoTile icon={<MapPin className="h-4 w-4 text-emerald-700" />} label="Lokasi" value={event.location_name} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#1B4332]">Kuota Peserta</span>
                          <span className="text-gray-500">{participantCount}/{quota}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${quotaPercent}%` }} />
                        </div>
                        {participantCount >= quota ? (
                          <p className="text-xs font-semibold text-red-600">Kuota penuh. Jalur pendaftaran perlu ditutup.</p>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryBox label="Pricing" value={event.is_paid ? `${formatCurrency(event.price_niam)} / ${formatCurrency(event.price_public)}` : 'Gratis'} />
                        <SummaryBox label="Narasumber" value={speakers.length > 0 ? speakers.map((speaker) => speaker.nama_lengkap).join(', ') : 'Belum dipilih'} />
                      </div>

                      <div className="rounded-2xl border border-gray-100 p-3">
                        <p className="text-xs text-gray-400">Kebutuhan Crew</p>
                        <p className="mt-1 text-sm font-semibold text-[#1B4332]">{getCrewNeeds(event).join(', ')}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Link href={`/admin/events/${event.id}`}>
                          <Button variant="outline" className="w-full rounded-xl sm:w-auto">
                            <Eye className="w-4 h-4" />
                            View Detail
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}`}>
                          <Button variant="outline" className="w-full rounded-xl sm:w-auto" disabled={readOnly}>
                            <Pencil className="w-4 h-4" />
                            Edit Event
                          </Button>
                        </Link>
                        <Select
                          value={event.status}
                          onValueChange={(value) => updateEventStatus(event.id, value as EventStatus)}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="h-8 rounded-xl sm:w-[180px]">
                            <SelectValue placeholder="Ganti status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

      </Tabs>
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
