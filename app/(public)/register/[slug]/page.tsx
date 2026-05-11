import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/RegisterForm'
import { getEventFromDb } from '@/lib/server/events'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false },
}

export default async function RegisterSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventFromDb(slug).catch(() => null)
  if (!event || (event.status !== 'APPROVED' && event.status !== 'approved')) notFound()

  return <RegisterForm event={event} />
}
