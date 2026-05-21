import { EventStatus } from '@/types'
import { eventStatusMeta } from '@/lib/event-status'

export function BadgeStatus({
  status,
  variant = 'default',
}: {
  status: EventStatus
  variant?: 'default' | 'public'
}) {
  const { label, badgeClassName, dotClassName } = eventStatusMeta(status)

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClassName}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
      {label}
    </span>
  )
}
