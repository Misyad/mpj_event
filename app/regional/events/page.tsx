import { redirect } from 'next/navigation'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getEventsFromDb } from '@/lib/server/events'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { RegionalEventsClient } from './RegionalEventsClient'

export const dynamic = 'force-dynamic'

export default async function RegionalEventsPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.regionalAdmin)
  if (!session?.regionalId) redirect('/auth/regional-admin-login')

  const events = (await getEventsFromDb()).filter((event) => event.scope === 'regional' && event.regionId === session.regionalId)

  return <RegionalEventsClient events={events} regionalId={session.regionalId} />
}
