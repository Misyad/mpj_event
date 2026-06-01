import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import { EventCard } from '@/components/EventCard'
import { isPublishedStatus, normalizeEventStatus } from '@/lib/event-status'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getEventsFromApiEvent } from '@/lib/api-event/events'
import { getEventTimestamp } from '@/utils/dateFormatter'
import type { Event } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PublicEventsPage() {
  let sourceEvents: Event[] = []
  let apiUnavailable = false
  const session = await getCurrentAdminSession(AUTH_ROLES.user)

  try {
    sourceEvents = await getEventsFromApiEvent()
  } catch {
    apiUnavailable = true
  }

  const events = sourceEvents
    .filter((event) => isPublishedStatus(event.status))
    .filter((event) => ['published', 'registration_closed', 'ongoing'].includes(normalizeEventStatus(event.status)))
    .sort((a, b) => getEventTimestamp(a.start_date) - getEventTimestamp(b.start_date))

  return (
    <div className="min-h-screen bg-[#F4F7F5]">
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
        <header className="flex items-start gap-3">
          <Link
            href={session ? '/profile/events' : '/'}
            aria-label="Kembali"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-[#1B4332] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e8f0ec] hover:shadow-md active:translate-y-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A227]">MPJ Event</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1B4332] sm:text-4xl">Event Tersedia</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
              Pilih event yang sedang tersedia untuk melihat detail dan melakukan pendaftaran.
            </p>
          </div>
        </header>

        {events.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1B4332]">
              Daftar Event
            </h2>
            <div className="flex flex-col gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0ec]">
              <Calendar className="h-7 w-7 text-[#1B4332]" />
            </div>
            <p className="text-lg font-bold text-[#1B4332]">{apiUnavailable ? 'Event belum bisa dimuat' : 'Belum ada event tersedia'}</p>
            <p className="mt-1 text-sm text-gray-400">
              {apiUnavailable ? 'Laravel api-event sedang belum bisa diakses.' : 'Event terbaru MPJ akan tampil di sini.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
