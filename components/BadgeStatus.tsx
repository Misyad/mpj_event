import { EventStatus } from '@/types'

const config: Record<EventStatus, { label: string; className: string }> = {
  APPROVED: { label: 'Live', className: 'bg-[#C9A227] text-white' },
  FINISHED: { label: 'Selesai', className: 'bg-gray-200 text-gray-500' },
  COMPLETED: { label: 'Selesai', className: 'bg-gray-200 text-gray-500' },
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-400' },
  PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-600' },
}

export function BadgeStatus({ status }: { status: EventStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
