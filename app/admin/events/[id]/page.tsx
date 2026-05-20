import EventDetailClient from './EventDetailClient'

export const dynamic = 'force-dynamic'

export default function KelolEventPage({ params }: { params: Promise<{ id: string }> }) {
  return <EventDetailClient params={params} />
}
