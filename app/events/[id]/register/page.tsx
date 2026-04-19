import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEventById, dummyEvents } from '@/lib/dummy'
import { RegisterForm } from '@/components/RegisterForm'

export const metadata: Metadata = {
  robots: { index: false },
}

export async function generateStaticParams() {
  return dummyEvents
    .filter((e) => e.status === 'APPROVED')
    .map((e) => ({ id: e.id }))
}

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = getEventById(id)
  if (!event || event.status !== 'APPROVED') notFound()

  return <RegisterForm event={event} />
}
