import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEventFromApiEvent } from '@/lib/api-event/events'
import { RegisterForm } from '@/components/RegisterForm'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { isRegistrationOpenStatus } from '@/lib/event-status'
import { getCurrentAdminSession, getPublicUserProfile } from '@/lib/server/rbac'

export const metadata: Metadata = {
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [event, session] = await Promise.all([
    getEventFromApiEvent(id).catch(() => null),
    getCurrentAdminSession(AUTH_ROLES.user),
  ])
  const profile = session ? await getPublicUserProfile(session.userId).catch(() => null) : null
  const resolvedEvent = event
  if (!resolvedEvent || !isRegistrationOpenStatus(resolvedEvent.status)) notFound()

  return (
    <RegisterForm
      event={resolvedEvent}
      registrationContext={{
        isLoggedIn: Boolean(session),
        userId: session?.userId ?? null,
        fullName: profile?.fullName ?? session?.fullName ?? null,
        email: profile?.email ?? session?.email ?? null,
        whatsapp: profile?.whatsapp ?? null,
        institution: profile?.institution ?? null,
        niam: profile?.niam ?? null,
      }}
    />
  )
}
