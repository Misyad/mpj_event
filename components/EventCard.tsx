import Link from 'next/link'
import Image from 'next/image'
import { Event } from '@/types'
import { BadgeStatus } from '@/components/BadgeStatus'
import { MapPin, Calendar } from 'lucide-react'
import { formatEventDateTime } from '@/utils/dateFormatter'

const DEFAULT_POSTER_URL = 'https://picsum.photos/seed/mpj-event/800/450'

export function EventCard({ event }: { event: Event }) {
  const posterUrl = normalizePosterUrl(event.poster_url || event.posterUrl)

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
        {/* Poster */}
        <div className="relative w-full aspect-video">
          <Image
            src={posterUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="430px"
          />
        </div>

        {/* Info */}
        <div className="px-4 py-4 space-y-2">
          <BadgeStatus status={event.status} variant="public" />

          <h2 className="font-bold text-[#1B4332] text-base leading-snug line-clamp-2">
            {event.title}
          </h2>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#C9A227]" />
              <span className="line-clamp-1">{event.location_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-[#C9A227]" />
              <span>{formatEventDateTime(event.start_date)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function normalizePosterUrl(value?: string | null) {
  if (!value) return DEFAULT_POSTER_URL

  const legacyUploadMatch = value.match(/^\/uploads\/posters\/([^/?#]+)$/)
  if (legacyUploadMatch) return `/api/uploads/posters/${legacyUploadMatch[1]}`

  return value
}
