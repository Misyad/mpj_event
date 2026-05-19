'use client'

import { EventManagementClient } from '@/components/events/EventManagementClient'
import type { Event } from '@/types'

export function RegionalEventsClient({ events, regionalId }: { events: Event[]; regionalId: string }) {
  return (
    <EventManagementClient
      mode="regional"
      title="Event Regional"
      subtitle="Data event otomatis difilter berdasarkan regional admin yang sedang login."
      scopeLabel="Regional Scope"
      initialEvents={events}
      regionalId={regionalId}
    />
  )
}
