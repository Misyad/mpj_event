import type { Metadata } from 'next'
import { EventDetailView, EventNotFoundState, getEventForDetail } from '@/app/(public)/events/event-detail'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { event } = await getEventForDetail(id)
  if (!event) return { title: 'Event tidak ditemukan' }
  return {
    title: `${event.title} - MPJ Apps`,
    description: event.description.slice(0, 155),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 155),
      images: [event.poster_url],
    },
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    return <EventDetailView identifier={id} />
  } catch {
    return <EventNotFoundState />
  }
}
