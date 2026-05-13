import { redirect } from 'next/navigation'

export default function DevUserDashboardPreviewRedirect() {
  redirect('/dev-preview/profile')
}
