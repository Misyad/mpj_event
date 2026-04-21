import { dummyEvents } from '@/lib/dummy'
import EventDetailClient from './EventDetailClient'

export function generateStaticParams() {
  return dummyEvents.map((e) => ({ id: e.id }))
}

export default function KelolEventPage({ params }: { params: Promise<{ id: string }> }) {
  return <EventDetailClient params={params} />
}
