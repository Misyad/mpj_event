import { EventCard } from '@/components/EventCard'
import { EventStatus } from '@/types'
import { Calendar } from 'lucide-react'
import { dummyEvents } from '@/lib/dummy'
import { getEventsFromDb } from '@/lib/server/events'
import Link from 'next/link'

const VISIBLE: EventStatus[] = ['APPROVED', 'FINISHED', 'COMPLETED']

export const dynamic = 'force-dynamic'

export default async function Home() {
  let sourceEvents = dummyEvents

  try {
    sourceEvents = await getEventsFromDb({ publicOnly: true })
  } catch {
    sourceEvents = dummyEvents
  }

  const events = sourceEvents
    .filter((e) => VISIBLE.includes(e.status) || e.status === 'approved' || e.status === 'finished')
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const live = events.filter((e) => e.status === 'APPROVED')
  const past = events.filter((e) => e.status !== 'APPROVED')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#C9A227]" />
          </div>
          <span className="font-extrabold text-[#1B4332] text-lg tracking-tight">MPJ Event</span>
        </div>
        <Link
          href="/scan"
          className="text-sm font-semibold text-[#1B4332] border-2 border-[#1B4332] px-4 py-1.5 rounded-full hover:bg-[#1B4332] hover:text-white transition-colors"
        >
          Masuk
        </Link>
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
            <p className="font-bold text-[#1B4332] text-lg">Belum ada event</p>
            <p className="text-sm text-gray-400 mt-1">Pantau terus untuk update terbaru</p>
          </div>
        )}
      </main>
    </div>
  )
}
