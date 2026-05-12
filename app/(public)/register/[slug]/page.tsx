import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/RegisterForm'
import { getEventFromDb } from '@/lib/server/events'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false },
}

export default async function RegisterSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [event, session] = await Promise.all([
    getEventFromDb(slug).catch(() => null),
    getCurrentAdminSession(AUTH_ROLES.user),
  ])
  if (!event || (event.status !== 'APPROVED' && event.status !== 'approved')) notFound()

  return (
    <RegisterForm
      event={event}
      registrationContext={{
        isLoggedIn: Boolean(session),
        userId: session?.userId ?? null,
        fullName: session?.fullName ?? null,
        email: session?.email ?? null,
      }}
    />
  )
}
