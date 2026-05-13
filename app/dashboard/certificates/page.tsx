import { redirect } from 'next/navigation'

export default function DashboardCertificatesRedirect() {
  redirect('/profile/certificates')
}
