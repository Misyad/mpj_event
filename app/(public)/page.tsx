import { EventCard } from '@/components/EventCard'
import { Calendar } from 'lucide-react'
import { dummyEvents } from '@/lib/dummy'
import { getEventsFromDb } from '@/lib/server/events'
import { LoginEntryDialog } from '@/components/auth/LoginEntryDialog'
import { BrandMark } from '@/components/BrandMark'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { isCompletedStatus, isPublishedStatus, normalizeEventStatus } from '@/lib/event-status'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { getEventTimestamp } from '@/utils/dateFormatter'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let sourceEvents = dummyEvents
  const session = await getCurrentAdminSession(AUTH_ROLES.user)

  try {
    sourceEvents = await getEventsFromDb({ publicOnly: true })
  } catch {
    sourceEvents = dummyEvents
  }

  const events = sourceEvents
    .filter((event) => isPublishedStatus(event.status))
    .sort((a, b) => getEventTimestamp(a.start_date) - getEventTimestamp(b.start_date))

  const live = events.filter((event) => ['published', 'registration_closed', 'ongoing'].includes(normalizeEventStatus(event.status)))
  const past = events.filter((event) => isCompletedStatus(event.status))

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BrandMark className="h-5 w-5" />
          <span className="font-extrabold text-[#1B4332] text-lg tracking-tight">MPJ Event</span>
        </div>
        <LoginEntryDialog
          user={
            session
              ? {
                  fullName: session.fullName ?? null,
                  email: session.email ?? null,
                }
              : null
          }
        />
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Live Events */}
        {live.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#1B4332] uppercase tracking-widest">
              Event Aktif
            </h2>
            <div className="flex flex-col gap-4">
              {live.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#1B4332] uppercase tracking-widest">
              Acara Sebelumnya
            </h2>
            <div className="flex flex-col gap-4">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#e8f0ec] flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-[#1B4332]" />
            </div>
            <p className="font-bold text-[#1B4332] text-lg">Belum ada event tersedia</p>
            <p className="text-sm text-gray-400 mt-1">Event terbaru MPJ akan tampil di sini.</p>
          </div>
        )}
      </main>
    </div>
  )
}
