import { EventManagementClient } from '@/components/events/EventManagementClient'

export default function MasterEventPage() {
  return (
    <EventManagementClient
      mode="admin-pusat"
      title="Kelola Event"
      subtitle="Lifecycle event Admin Pusat dari daftar event hingga publikasi."
      scopeLabel="Admin Pusat"
      createHref="/admin-pusat/events/new"
    />
  )
}
