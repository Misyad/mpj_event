import Link from 'next/link'
import { Children, type ReactNode } from 'react'
import { ArrowUpRight, CheckCircle2, Circle, Clock3, Sparkles, Ticket } from 'lucide-react'
import type { UserEventHistoryItem } from '@/lib/server/events'
import type { PublicUserProfile } from '@/lib/server/rbac'
import type { Event } from '@/types'
import { isCompletedStatus, isPublishedStatus, normalizeEventStatus } from '@/lib/event-status'
import { cn } from '@/lib/utils'
import { formatEventDateTime, getEventTimestamp } from '@/utils/dateFormatter'

type ChecklistItem = {
  label: string
  done: boolean
  optional?: boolean
}

function getTicketCode(item: UserEventHistoryItem) {
  return item.participant.ticketCode || item.participant.qr_token || ''
}

function eventHref(event: Event) {
  return `/events/${encodeURIComponent(event.slug || event.id)}`
}

function ticketHref(item: UserEventHistoryItem) {
  return `/ticket/${encodeURIComponent(getTicketCode(item))}`
}

function isPendingPayment(item: UserEventHistoryItem) {
  const paymentStatus = String(item.participant.payment_status || '').toLowerCase()
  return Boolean(paymentStatus && !['paid', 'free'].includes(paymentStatus))
}

function isActiveHistoryItem(item: UserEventHistoryItem) {
  const participantStatus = String(item.participant.status || item.participant.attendance_status || '').toLowerCase()
  if (participantStatus === 'cancelled') return false
  if (isCompletedStatus(item.event.status)) return false
  return getEventTimestamp(item.event.start_date) >= Date.now() || ['published', 'registration_closed', 'ongoing'].includes(normalizeEventStatus(item.event.status))
}

function isRecommendedEvent(event: Event) {
  return isPublishedStatus(event.status) && ['published', 'registration_closed', 'ongoing'].includes(normalizeEventStatus(event.status))
}

export function ProfileActionCenter({
  profile,
  eventHistory,
  publicEvents,
}: {
  profile: PublicUserProfile | null
  eventHistory: UserEventHistoryItem[]
  publicEvents: Event[]
}) {
  const checklist: ChecklistItem[] = [
    { label: 'Nama lengkap', done: Boolean(profile?.fullName) },
    { label: 'WhatsApp', done: Boolean(profile?.whatsapp) },
    { label: 'Instansi', done: Boolean(profile?.institution) },
    { label: 'Email akun', done: Boolean(profile?.email) },
    { label: 'NIAM', done: Boolean(profile?.niam), optional: true },
  ]
  const completedCount = checklist.filter((item) => item.done || item.optional).length
  const completionPercent = Math.round((completedCount / checklist.length) * 100)
  const pendingItems = eventHistory.filter(isPendingPayment).slice(0, 2)
  const activeItems = eventHistory.filter(isActiveHistoryItem).slice(0, 2)
  const activeTicket = activeItems.find((item) => getTicketCode(item)) ?? eventHistory.find((item) => getTicketCode(item)) ?? null
  const followedEventIds = new Set(eventHistory.map((item) => item.event.id))
  const recommendedEvents = publicEvents
    .filter(isRecommendedEvent)
    .filter((event) => !followedEventIds.has(event.id))
    .sort((a, b) => getEventTimestamp(a.start_date) - getEventTimestamp(b.start_date))
    .slice(0, 3)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#1B4332]">Action Center</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">Aksi penting untuk akun dan event Anda.</p>
        </div>
        <span className="rounded-full bg-[#e8f0ec] px-3 py-1 text-xs font-black text-[#1B4332]">
          {completionPercent}% profil
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#1B4332]">Kelengkapan Profil</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Data ini dipakai otomatis saat mendaftar event.
              </p>
            </div>
            <Link href="/profile/edit" className="shrink-0 rounded-full bg-[#1B4332] px-3 py-1.5 text-xs font-bold text-white">
              Edit
            </Link>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f0ec]">
            <div className="h-full rounded-full bg-[#1B4332]" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>

        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 rounded-2xl bg-[#f4f7f5] px-3 py-2">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className={cn('h-4 w-4 shrink-0', item.optional ? 'text-slate-300' : 'text-amber-500')} />
              )}
              <span className="text-xs font-bold text-[#1B4332]">{item.label}</span>
              {item.optional ? <span className="text-[10px] font-bold uppercase text-slate-400">Opsional</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionPanel
          title="Aksi Aktif"
          emptyText="Belum ada pembayaran atau event aktif."
          icon={<Clock3 className="h-5 w-5" />}
        >
          {[...pendingItems, ...activeItems.filter((item) => !pendingItems.some((pending) => pending.participant.id === item.participant.id))]
            .slice(0, 3)
            .map((item) => (
              <EventActionRow
                key={item.participant.id}
                item={item}
                label={isPendingPayment(item) ? 'Butuh pembayaran/konfirmasi' : 'Event aktif'}
                href={eventHref(item.event)}
              />
            ))}
        </ActionPanel>

        <ActionPanel
          title="Tiket Aktif"
          emptyText="Tiket aktif akan muncul setelah Anda mendaftar event."
          icon={<Ticket className="h-5 w-5" />}
        >
          {activeTicket ? (
            <div className="rounded-2xl border border-[#1B4332]/10 bg-[#f4f7f5] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Nomor Tiket</p>
              <p className="mt-1 truncate font-mono text-sm font-black text-[#1B4332]">{getTicketCode(activeTicket)}</p>
              <p className="mt-2 line-clamp-2 text-sm font-bold text-[#1B4332]">{activeTicket.event.title}</p>
              <Link
                href={ticketHref(activeTicket)}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#1B4332] px-4 text-xs font-black text-white"
              >
                Buka Tiket
              </Link>
            </div>
          ) : null}
        </ActionPanel>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-[#8a6d16]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1B4332]">Rekomendasi Event</p>
              <p className="text-xs font-medium text-gray-500">Event tersedia yang belum Anda ikuti.</p>
            </div>
          </div>
          <Link href="/events" className="shrink-0 text-xs font-black text-[#1B4332] hover:underline">
            Lihat semua
          </Link>
        </div>

        {recommendedEvents.length > 0 ? (
          <div className="space-y-2">
            {recommendedEvents.map((event) => (
              <Link key={event.id} href={eventHref(event)} className="block rounded-2xl bg-[#f4f7f5] px-4 py-3 transition hover:bg-[#e8f0ec]">
                <p className="line-clamp-1 text-sm font-black text-[#1B4332]">{event.title}</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">{formatEventDateTime(event.start_date)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-[#f4f7f5] p-4 text-center text-sm font-semibold text-gray-500">
            Belum ada rekomendasi event baru.
          </p>
        )}
      </div>
    </section>
  )
}

function ActionPanel({
  title,
  emptyText,
  icon,
  children,
}: {
  title: string
  emptyText: string
  icon: ReactNode
  children: ReactNode
}) {
  const hasChildren = Children.count(children) > 0

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
          {icon}
        </div>
        <p className="text-sm font-black text-[#1B4332]">{title}</p>
      </div>
      {hasChildren ? children : <p className="rounded-2xl bg-[#f4f7f5] p-4 text-center text-sm font-semibold text-gray-500">{emptyText}</p>}
    </div>
  )
}

function EventActionRow({ item, label, href }: { item: UserEventHistoryItem; label: string; href: string }) {
  return (
    <Link href={href} className="mb-2 block rounded-2xl bg-[#f4f7f5] px-4 py-3 transition last:mb-0 hover:bg-[#e8f0ec]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-black text-[#1B4332]">{item.event.title}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500">{label}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#C9A227]" />
      </div>
    </Link>
  )
}
