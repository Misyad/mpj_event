import { EventStatus } from '@/types'

const config: Record<EventStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-400' },
  PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-600' },
  APPROVED: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700' },
  LIVE: { label: 'Live', className: 'bg-[#C9A227] text-white' },
  FINISHED: { label: 'Selesai', className: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
}

export function BadgeStatus({ status }: { status: EventStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
