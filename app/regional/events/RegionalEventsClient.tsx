'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ExternalLink, MapPin, Search, Ticket, UsersRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Event, EventCategory, EventStatus } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu',
  APPROVED: 'Published',
  LIVE: 'Berjalan',
  FINISHED: 'Selesai',
  COMPLETED: 'Completed',
  draft: 'Draft',
  pending: 'Menunggu',
  approved: 'Published',
  registration_closed: 'Pendaftaran Ditutup',
  finished: 'Selesai',
}

const STATUS_OPTIONS: Array<EventStatus | 'ALL'> = ['ALL', 'draft', 'pending', 'approved', 'registration_closed', 'finished', 'COMPLETED']
const CATEGORY_OPTIONS: Array<EventCategory | 'ALL'> = ['ALL', 'Pelatihan', 'Seremonial', 'Rapat']

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusClass(status: EventStatus) {
  const normalized = String(status).toLowerCase()
  if (normalized === 'approved' || normalized === 'live') return 'bg-emerald-50 text-emerald-700'
  if (normalized === 'pending') return 'bg-amber-50 text-amber-700'
  if (normalized === 'finished' || normalized === 'completed') return 'bg-slate-100 text-slate-600'
  if (normalized === 'registration_closed') return 'bg-red-50 text-red-600'
  return 'bg-gray-100 text-gray-600'
}

function isOpenEvent(event: Event) {
  return event.status_pendaftaran !== 'closed' && !['finished', 'completed'].includes(String(event.status).toLowerCase())
}

function eventPublicHref(event: Event) {
  return `/events/${encodeURIComponent(event.slug || event.id)}`
}

function eventRegisterHref(event: Event) {
  return `/register/${encodeURIComponent(event.slug || event.id)}`
}

export function RegionalEventsClient({ events, regionalId }: { events: Event[]; regionalId: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'ALL'>('ALL')

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch =
        !keyword ||
        event.title.toLowerCase().includes(keyword) ||
        event.description.toLowerCase().includes(keyword) ||
        (event.location ?? event.location_name ?? '').toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
      const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [categoryFilter, events, search, statusFilter])

  const stats = useMemo(() => ({
    total: events.length,
    open: events.filter(isOpenEvent).length,
    published: events.filter((event) => String(event.status).toLowerCase() === 'approved' || event.isPublished).length,
    participants: events.reduce((sum, event) => sum + (event.registeredCount ?? event.current_participants ?? 0), 0),
  }), [events])

  function resetFilters() {
    setSearch('')
    setStatusFilter('ALL')
    setCategoryFilter('ALL')
  }

  const hasFilter = search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Regional Scope</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Event Regional</h1>
            <p className="mt-1 text-sm text-gray-500">Data event otomatis difilter berdasarkan regional admin yang sedang login.</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">{regionalId}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: 'Total Event', value: stats.total, icon: CalendarDays, color: 'text-[#1B4332]', bg: 'bg-emerald-50' },
            { label: 'Pendaftaran Aktif', value: stats.open, icon: Ticket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Peserta', value: stats.participants, icon: UsersRound, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-xl border-gray-200 bg-white pl-9"
              placeholder="Cari nama event, lokasi, atau deskripsi..."
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => value != null && setStatusFilter(value as EventStatus | 'ALL')}>
            <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white lg:w-52">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>{status === 'ALL' ? 'Semua status' : STATUS_LABELS[status] ?? status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(value) => value != null && setCategoryFilter(value as EventCategory | 'ALL')}>
            <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white lg:w-52">
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((category) => (
                <SelectItem key={category} value={category}>{category === 'ALL' ? 'Semua kategori' : category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilter ? (
            <button type="button" onClick={resetFilters} className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 transition-colors hover:text-red-500">
              Reset
            </button>
          ) : null}
        </div>

        <p className="text-xs text-gray-400">
          Menampilkan <span className="font-bold text-gray-600">{filteredEvents.length}</span> dari {events.length} event regional
          {hasFilter ? <span className="font-semibold text-[#1B4332]"> (difilter)</span> : null}
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          {filteredEvents.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-44 bg-gray-100">
                <Image src={event.posterUrl || event.poster_url || 'https://placehold.co/1200x600?text=MPJ+Event'} alt={event.title} fill sizes="(max-width: 1280px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(event.status)}`}>{STATUS_LABELS[event.status] ?? event.status}</span>
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-700">{event.category}</span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h2 className="text-lg font-extrabold text-[#1B4332]">{event.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{event.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoTile icon={<CalendarDays className="h-4 w-4 text-emerald-700" />} label="Tanggal" value={formatDate(event.dateStart ?? event.start_date)} />
                  <InfoTile icon={<MapPin className="h-4 w-4 text-emerald-700" />} label="Lokasi" value={event.location ?? event.location_name ?? '-'} />
                  <InfoTile icon={<UsersRound className="h-4 w-4 text-emerald-700" />} label="Peserta" value={`${event.registeredCount ?? event.current_participants ?? 0}/${event.quota ?? event.max_participants ?? '-'}`} />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link href={eventPublicHref(event)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:border-[#1B4332] hover:text-[#1B4332]">
                    <ExternalLink className="h-4 w-4" />
                    Lihat Publik
                  </Link>
                  {isOpenEvent(event) ? (
                    <Link href={eventRegisterHref(event)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#14532d]">
                      <Ticket className="h-4 w-4" />
                      Link Registrasi
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">
            Belum ada event regional yang cocok.
          </div>
        ) : null}
      </div>
    </main>
  )
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-bold text-[#1B4332] line-clamp-2">{value}</p>
    </div>
  )
}
