import { RegistrationStatus } from '@/types'

interface QuotaBadgeProps {
  maxParticipants?: number
  currentParticipants?: number
  status?: RegistrationStatus
  size?: 'sm' | 'md'
}

export function QuotaBadge({ maxParticipants, currentParticipants = 0, status, size = 'md' }: QuotaBadgeProps) {
  if (!maxParticipants) return null

  const remaining = maxParticipants - currentParticipants
  const pct = (currentParticipants / maxParticipants) * 100

  if (status === 'full' || remaining <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-gray-200 text-gray-500 ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}>
        🔒 Kuota Penuh
      </span>
    )
  }

  if (status === 'closed') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-red-100 text-red-600 ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}>
        🚫 Pendaftaran Ditutup
      </span>
    )
  }

  const color = pct >= 80
    ? 'bg-red-100 text-red-600'
    : pct >= 50
    ? 'bg-amber-100 text-amber-700'
    : 'bg-emerald-100 text-emerald-700'

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${color} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}>
      {pct >= 80 ? '🔥' : '🎟️'} Sisa {remaining} dari {maxParticipants} kuota
    </span>
  )
}
