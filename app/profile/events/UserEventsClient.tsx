'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type ReactNode, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Download,
  FileBadge2,
  Sparkles,
  Ticket,
  XCircle,
} from 'lucide-react'
import type { UserEventHistoryItem } from '@/lib/server/events'
import { cn } from '@/lib/utils'
import { formatEventDateTime, getEventTimestamp } from '@/utils/dateFormatter'

type FilterKey = 'all' | 'upcoming' | 'finished'

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'upcoming', label: 'Akan Datang' },
  { key: 'finished', label: 'Selesai' },
]

export function UserEventsClient({
  items,
  certificateCount,
}: {
  items: UserEventHistoryItem[]
  certificateCount: number
}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, activeFilter)),
    [activeFilter, items],
  )

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
      <header className="sticky top-0 z-20 -mx-4 bg-[#F4F7F5]/90 px-4 pb-4 pt-3 backdrop-blur-xl sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-0">
        <div className="flex items-start gap-3">
          <Link
            href="/profile"
            aria-label="Kembali ke profil"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-[#1B4332] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e8f0ec] hover:shadow-md active:translate-y-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A227]">MPJ Event</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1B4332] sm:text-4xl">Riwayat Event</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
              Lihat seluruh event yang pernah Anda ikuti.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatPill label="Event Diikuti" value={items.length} />
          <StatPill label="Sertifikat" value={certificateCount} />
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-bold transition active:scale-[0.98]',
                  activeFilter === filter.key
                    ? 'bg-[#1B4332] text-white shadow-md shadow-[#1B4332]/15'
                    : 'border border-white/80 bg-white text-[#1B4332] shadow-sm hover:bg-[#e8f0ec]',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-white/80 bg-white/75 p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
                <CalendarDays className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-lg font-black text-[#1B4332]">Tidak ada event pada filter ini</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                Coba lihat semua riwayat event Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <EventHistoryCard key={item.participant.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EventHistoryCard({ item }: { item: UserEventHistoryItem }) {
  const [copied, setCopied] = useState(false)
  const status = getStatusMeta(item)
  const payment = getPaymentMeta(item.participant.payment_status)
  const displayTicket = getDisplayTicketCode(item)
  const ticketCode = item.participant.ticketCode || item.participant.qr_token
  const eventHref = `/events/${encodeURIComponent(item.event.slug || item.event.id)}`
  const ticketHref = `/ticket/${encodeURIComponent(ticketCode)}`
  const certificateHref = item.certificateVerificationCode ? `/certificate/${encodeURIComponent(item.certificateVerificationCode)}` : ''

  async function copyTicketCode() {
    try {
      await navigator.clipboard.writeText(displayTicket)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/90 bg-white shadow-[0_18px_50px_rgba(27,67,50,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(27,67,50,0.16)]">
      <EventVisual item={item} />

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <ModernBadge icon={status.icon} label={status.label} className={status.className} />
          <ModernBadge icon={payment.icon} label={payment.label} className={payment.className} />
          <ModernBadge icon={<Ticket className="h-3.5 w-3.5" />} label={item.event.category} className="bg-blue-50 text-blue-700 ring-blue-100" />
        </div>

        <div>
          <h2 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-[#143728] sm:text-2xl">
            {item.event.title}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#C9A227]" />
            <span>{formatEventDateTime(item.event.start_date)}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#1B4332]/10 bg-[#F4F7F5] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Nomor Tiket</p>
              <p className="mt-1 truncate font-mono text-sm font-bold text-[#1B4332]">{displayTicket}</p>
            </div>
            <button
              type="button"
              onClick={copyTicketCode}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#1B4332]/10 bg-white px-3 text-xs font-bold text-[#1B4332] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e8f0ec] active:translate-y-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Tersalin' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <ActionLink href={eventHref} label="Lihat Detail" variant="primary" />
          <ActionLink href={ticketHref} label="Download Tiket" icon={<Download className="h-4 w-4" />} />
          {item.certificateEligible && certificateHref ? (
            <ActionLink href={certificateHref} label="Sertifikat" icon={<FileBadge2 className="h-4 w-4" />} />
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-center text-xs font-bold text-slate-400">
              Sertifikat belum tersedia
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function EventVisual({ item }: { item: UserEventHistoryItem }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = item.event.posterUrl || item.event.poster_url
  const showImage = Boolean(imageUrl) && !failed

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#1B4332]">
      {showImage ? (
        <Image
          src={imageUrl}
          alt={item.event.title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1B4332_0%,#2D6A4F_52%,#C9A227_100%)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
            <Ticket className="h-8 w-8" />
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#1B4332] shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-[#C9A227]" />
          MPJ Event
        </span>
        {item.certificateEligible ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/95 px-3 py-1.5 text-xs font-black text-[#8a6d16] shadow-sm backdrop-blur">
            <FileBadge2 className="h-3.5 w-3.5" />
            Sertifikat
          </span>
        ) : null}
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white px-4 py-3 shadow-sm">
      <p className="text-2xl font-black leading-none text-[#1B4332]">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  )
}

function ModernBadge({
  icon,
  label,
  className,
}: {
  icon: ReactNode
  label: string
  className: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1', className)}>
      {icon}
      {label}
    </span>
  )
}

function ActionLink({
  href,
  label,
  icon,
  variant = 'secondary',
}: {
  href: string
  label: string
  icon?: ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-center text-xs font-black transition hover:-translate-y-0.5 active:translate-y-0',
        variant === 'primary'
          ? 'bg-[#1B4332] text-white shadow-md shadow-[#1B4332]/15 hover:bg-[#143728]'
          : 'border border-[#1B4332]/10 bg-white text-[#1B4332] shadow-sm hover:bg-[#e8f0ec]',
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/80 bg-white text-center shadow-[0_18px_50px_rgba(27,67,50,0.10)]">
      <div className="bg-[linear-gradient(135deg,#1B4332_0%,#2D6A4F_55%,#C9A227_100%)] px-8 py-10 text-white">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
          <Ticket className="h-8 w-8" />
        </div>
      </div>
      <div className="px-8 py-8">
        <h2 className="text-2xl font-black tracking-tight text-[#1B4332]">Belum ada event diikuti</h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
          Ayo daftar event pertama Anda dan simpan tiketnya langsung di sini.
        </p>
        <Link
          href="/events"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1B4332] px-5 text-sm font-black text-white shadow-md shadow-[#1B4332]/15 transition hover:-translate-y-0.5 hover:bg-[#143728] active:translate-y-0"
        >
          Lihat Event
        </Link>
      </div>
    </div>
  )
}

function getStatusMeta(item: UserEventHistoryItem) {
  const status = String(item.participant.status || item.participant.attendance_status || 'registered').toLowerCase()

  if (status === 'confirmed') {
    return {
      label: 'Terkonfirmasi',
      icon: <Check className="h-3.5 w-3.5" />,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    }
  }
  if (status === 'attended') {
    return {
      label: 'Hadir',
      icon: <Check className="h-3.5 w-3.5" />,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    }
  }
  if (status === 'cancelled') {
    return {
      label: 'Dibatalkan',
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: 'bg-red-50 text-red-700 ring-red-100',
    }
  }
  return {
    label: 'Terdaftar',
    icon: <Clock3 className="h-3.5 w-3.5" />,
    className: 'bg-amber-50 text-amber-700 ring-amber-100',
  }
}

function getPaymentMeta(value: string) {
  const status = String(value || '').toLowerCase()
  if (status === 'paid') {
    return {
      label: 'Lunas',
      icon: <Check className="h-3.5 w-3.5" />,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    }
  }
  if (status === 'free') {
    return {
      label: 'Free',
      icon: <Ticket className="h-3.5 w-3.5" />,
      className: 'bg-blue-50 text-blue-700 ring-blue-100',
    }
  }
  if (status.includes('cancel') || status.includes('failed')) {
    return {
      label: 'Gagal',
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: 'bg-red-50 text-red-700 ring-red-100',
    }
  }
  return {
    label: 'Pending',
    icon: <Clock3 className="h-3.5 w-3.5" />,
    className: 'bg-amber-50 text-amber-700 ring-amber-100',
  }
}

function matchesFilter(item: UserEventHistoryItem, filter: FilterKey) {
  if (filter === 'all') return true
  const status = String(item.participant.status || item.participant.attendance_status || '').toLowerCase()
  const eventDate = getEventTimestamp(item.event.start_date)
  const isFinished = status === 'attended' || eventDate < Date.now()
  return filter === 'finished' ? isFinished : !isFinished
}

function getDisplayTicketCode(item: UserEventHistoryItem) {
  const source = item.participant.id || item.event.id || item.participant.qr_token || item.participant.ticketCode || ''
  const normalized = source.replace(/[^a-zA-Z0-9]/g, '')
  let checksum = 0

  for (let index = 0; index < normalized.length; index += 1) {
    checksum = (checksum * 31 + normalized.charCodeAt(index)) % 10000
  }

  return `#${String(checksum).padStart(4, '0')}`
}
