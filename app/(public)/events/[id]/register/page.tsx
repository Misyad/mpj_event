import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEventById } from '@/lib/dummy'
import { getEventFromDb } from '@/lib/server/events'
import { RegisterForm } from '@/components/RegisterForm'

export const metadata: Metadata = {
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = (await getEventFromDb(id).catch(() => null)) ?? getEventById(id)
  if (!event || event.status !== 'APPROVED') notFound()

  return <RegisterForm event={event} />
}
