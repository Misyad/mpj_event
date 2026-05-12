import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getEventById } from '@/lib/dummy'
import { getEventFromDb } from '@/lib/server/events'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false },
}

export default async function RegisterSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = (await getEventFromDb(slug).catch(() => null)) ?? getEventById(slug)
  if (!event || (event.status !== 'APPROVED' && event.status !== 'approved')) notFound()

  redirect(`/events/${event.id}/register`)
}
