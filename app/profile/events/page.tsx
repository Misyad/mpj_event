import Link from 'next/link'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ArrowLeft, CalendarDays, Ticket } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { getUserEventHistoryFromDb, type UserEventHistoryItem } from '@/lib/server/events'
import { UserEmptyState } from '@/components/user/UserEmptyState'

export default async function UserEventsPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fprofile%2Fevents')
  const items = await getUserEventHistoryFromDb(session.userId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1B4332] shadow-sm transition hover:bg-[#f4f7f5]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1B4332]">Riwayat Event</h1>
          <p className="text-sm text-gray-500">Daftar event yang pernah Anda ikuti.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <UserEmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title="Belum ada riwayat event"
          description="Event yang Anda ikuti akan muncul di sini."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => <EventHistoryCard key={item.participant.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

function EventHistoryCard({ item }: { item: UserEventHistoryItem }) {
  const status = String(item.participant.status || item.participant.attendance_status || 'registered').toLowerCase()

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
          <Ticket className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-extrabold text-[#1B4332]">{item.event.title}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">{formatDate(item.event.start_date)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{statusLabel(status)}</Badge>
            <Badge>{item.participant.payment_status}</Badge>
            {item.participant.ticketCode ? <Badge>{item.participant.ticketCode}</Badge> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[#f4f7f5] px-3 py-1 text-xs font-bold text-[#1B4332]">
      {children}
    </span>
  )
}

function statusLabel(status: string) {
  if (status === 'confirmed') return 'Terkonfirmasi'
  if (status === 'attended') return 'Hadir'
  if (status === 'cancelled') return 'Dibatalkan'
  return 'Terdaftar'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}
