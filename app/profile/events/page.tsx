import { redirect } from 'next/navigation'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { getUserEventHistoryFromDb } from '@/lib/server/events'
import { UserEventsClient } from './UserEventsClient'

export default async function UserEventsPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fprofile%2Fevents')
  const items = await getUserEventHistoryFromDb(session.userId)
  const certificateCount = items.filter((item) => item.certificateEligible).length

  return <UserEventsClient items={items} certificateCount={certificateCount} />
}
