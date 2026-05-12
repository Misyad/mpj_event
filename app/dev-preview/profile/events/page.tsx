import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ExternalLink, CalendarDays } from 'lucide-react'
import { notFound } from 'next/navigation'
import { UserEmptyState } from '@/components/user/UserEmptyState'

export default function DevEventsPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  // Mock events for preview
  const mockEvents = [
    {
      id: '1',
      title: 'Pelatihan Kader Digital MPJ',
      date: '24 Mei 2024',
      location: 'Jakarta Selatan',
      status: 'Terdaftar',
      statusColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: '2',
      title: 'Seminar Nasional Kemandirian Ekonomi',
      date: '12 April 2024',
      location: 'Online (Zoom)',
      status: 'Selesai',
      statusColor: 'bg-emerald-100 text-emerald-700',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-center text-xs font-bold uppercase tracking-widest">
        Preview UI Only
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dev-preview/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1B4332] shadow-sm transition hover:bg-[#f4f7f5]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1B4332]">Riwayat Event</h1>
          <p className="text-sm text-gray-500">Daftar event yang pernah Anda ikuti.</p>
        </div>
      </div>

      {mockEvents.length === 0 ? (
        <UserEmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title="Belum ada event yang diikuti"
          description="Jelajahi berbagai event menarik di MPJ Event dan jadilah bagian dari perubahan."
        />
      ) : (
        <div className="space-y-4">
          {mockEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-[1.75rem] border border-white/80 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-extrabold text-[#1B4332] leading-tight">{event.title}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.statusColor}`}>
                  {event.status}
                </span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#f4f7f5] text-[#1B4332] text-sm font-bold transition hover:bg-[#e8f0ec]">
                  Detail Event
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
