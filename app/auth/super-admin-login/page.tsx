import { RoleLoginForm } from '@/components/auth/RoleLoginForm'
import { AUTH_ROLES } from '@/lib/auth/roles'

export default function SuperAdminLoginPage() {
  return <RoleLoginForm role={AUTH_ROLES.superAdmin} />
}
