import { EventStatus } from '@/types'

const config: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-400' },
  PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-600' },
  APPROVED: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700' },
  LIVE: { label: 'Live', className: 'bg-[#C9A227] text-white' },
  FINISHED: { label: 'Selesai', className: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-400' },
  pending: { label: 'Pending', className: 'bg-orange-100 text-orange-600' },
  approved: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700' },
  registration_closed: { label: 'Pendaftaran Ditutup', className: 'bg-red-100 text-red-600' },
  finished: { label: 'Selesai', className: 'bg-purple-100 text-purple-700' },
}

const publicLabels: Partial<Record<EventStatus, string>> = {
  APPROVED: 'Published',
  FINISHED: 'Selesai',
  COMPLETED: 'Selesai',
}

export function BadgeStatus({
  status,
  variant = 'default',
}: {
  status: EventStatus
  variant?: 'default' | 'public'
}) {
  const { label, className } = config[status] ?? config.DRAFT
  const displayLabel = variant === 'public' ? (publicLabels[status] ?? label) : label

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {displayLabel}
    </span>
  )
}
