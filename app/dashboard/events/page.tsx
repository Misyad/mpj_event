import { redirect } from 'next/navigation'

export default function DashboardEventsRedirect() {
  redirect('/profile/events')
}
