import type { EventStatus } from '@/types'

export type EventLifecycleStatus = 'draft' | 'published' | 'registration_closed' | 'ongoing' | 'completed'
export type EventApprovalStatus = 'pending' | 'rejected'

export const EVENT_STATUS: Array<{ value: EventLifecycleStatus; label: string; color: 'gray' | 'blue' | 'orange' | 'emerald' | 'slate' }> = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'published', label: 'Published', color: 'blue' },
  { value: 'registration_closed', label: 'Pendaftaran Ditutup', color: 'orange' },
  { value: 'ongoing', label: 'Berjalan', color: 'emerald' },
  { value: 'completed', label: 'Selesai', color: 'slate' },
]

export const EVENT_STATUS_VALUES = EVENT_STATUS.map((status) => status.value)

export const EVENT_STATUS_META: Record<EventLifecycleStatus, { label: string; badgeClassName: string; dotClassName: string }> = {
  draft: {
    label: 'Draft',
    badgeClassName: 'bg-gray-100 text-gray-700 ring-gray-200',
    dotClassName: 'bg-gray-400',
  },
  published: {
    label: 'Published',
    badgeClassName: 'bg-blue-50 text-blue-700 ring-blue-200',
    dotClassName: 'bg-blue-500',
  },
  registration_closed: {
    label: 'Pendaftaran Ditutup',
    badgeClassName: 'bg-orange-50 text-orange-700 ring-orange-200',
    dotClassName: 'bg-orange-500',
  },
  ongoing: {
    label: 'Berjalan',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dotClassName: 'bg-emerald-500',
  },
  completed: {
    label: 'Selesai',
    badgeClassName: 'bg-slate-100 text-slate-700 ring-slate-200',
    dotClassName: 'bg-slate-500',
  },
}

const APPROVAL_STATUS_META: Record<EventApprovalStatus, { label: string; badgeClassName: string; dotClassName: string }> = {
  pending: {
    label: 'Menunggu Approval',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-amber-200',
    dotClassName: 'bg-amber-500',
  },
  rejected: {
    label: 'Ditolak',
    badgeClassName: 'bg-red-50 text-red-700 ring-red-200',
    dotClassName: 'bg-red-500',
  },
}

export function normalizeEventStatus(value: unknown): EventStatus {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'draft') return 'draft'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'rejected') return 'rejected'
  if (normalized === 'published' || normalized === 'approved') return 'published'
  if (normalized === 'registration_closed') return 'registration_closed'
  if (normalized === 'ongoing' || normalized === 'live') return 'ongoing'
  if (normalized === 'completed' || normalized === 'finished') return 'completed'

  return 'draft'
}

export function isLifecycleStatus(value: unknown): value is EventLifecycleStatus {
  return EVENT_STATUS_VALUES.includes(normalizeEventStatus(value) as EventLifecycleStatus)
}

export function isApprovalStatus(value: unknown): value is EventApprovalStatus {
  const status = normalizeEventStatus(value)
  return status === 'pending' || status === 'rejected'
}

export function isPublishedStatus(value: unknown) {
  const status = normalizeEventStatus(value)
  return status === 'published' || status === 'ongoing' || status === 'registration_closed' || status === 'completed'
}

export function isRegistrationOpenStatus(value: unknown) {
  return normalizeEventStatus(value) === 'published'
}

export function isCompletedStatus(value: unknown) {
  return normalizeEventStatus(value) === 'completed'
}

export function isRegistrationClosedStatus(value: unknown) {
  const status = normalizeEventStatus(value)
  return status === 'registration_closed' || status === 'ongoing' || status === 'completed'
}

export function eventStatusMeta(value: unknown) {
  const status = normalizeEventStatus(value)
  return EVENT_STATUS_META[status as EventLifecycleStatus] ?? APPROVAL_STATUS_META[status as EventApprovalStatus] ?? EVENT_STATUS_META.draft
}
