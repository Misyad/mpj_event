import type { Metadata } from 'next'
import { EventDetailView, getEventForDetail } from '@/app/(public)/events/event-detail'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { event } = await getEventForDetail(slug)
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

export default async function EventSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <EventDetailView identifier={slug} />
}
