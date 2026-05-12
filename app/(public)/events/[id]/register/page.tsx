import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEventById } from '@/lib/dummy'
import { getEventFromDb } from '@/lib/server/events'
import { RegisterForm } from '@/components/RegisterForm'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export const metadata: Metadata = {
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [event, session] = await Promise.all([
    getEventFromDb(id).catch(() => null),
    getCurrentAdminSession(AUTH_ROLES.user),
  ])
  const resolvedEvent = event ?? getEventById(id)
  if (!resolvedEvent || (resolvedEvent.status !== 'APPROVED' && resolvedEvent.status !== 'approved')) notFound()

  return (
    <RegisterForm
      event={resolvedEvent}
      registrationContext={{
        isLoggedIn: Boolean(session),
        userId: session?.userId ?? null,
        fullName: session?.fullName ?? null,
        email: session?.email ?? null,
      }}
    />
  )
}
