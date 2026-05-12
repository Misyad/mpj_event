import { redirect } from 'next/navigation'
import { RoleLoginForm } from '@/components/auth/RoleLoginForm'
import { getSafeRedirectPath } from '@/lib/auth/role-config'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export default async function RegionalAdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const session = await getCurrentAdminSession()
  if (session) redirect(getSafeRedirectPath(next, session.role))

  return <RoleLoginForm nextPath={next} />
}
