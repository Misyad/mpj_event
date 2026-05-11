import { RoleLoginForm } from '@/components/auth/RoleLoginForm'
import { AUTH_ROLES } from '@/lib/auth/roles'

export default function UserLoginPage() {
  return <RoleLoginForm role={AUTH_ROLES.user} />
}
