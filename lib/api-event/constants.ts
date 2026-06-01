import type { AttendanceStatus, EventStatus, PaymentStatus, RegistrationPath, RegistrationStatus } from '@/types'
import type { FinanceTransaction } from '@/components/finance/types'

export const API_EVENT_DEFAULT_POSTER_URL = 'https://picsum.photos/seed/mpj-event/800/450'

export const API_EVENT_DEFAULT_BANK_ACCOUNT = {
  bank_name: 'BCA',
  account_number: '1234567890',
  account_name: 'MPJ Indonesia',
} as const

export const API_EVENT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  COMPLETED: 'COMPLETED',
} as const

export type ApiEventStatus = typeof API_EVENT_STATUS[keyof typeof API_EVENT_STATUS]

export const API_EVENT_PAYMENT_STATUS = {
  FREE: 'Free',
  UNPAID: 'Unpaid',
  PENDING_APPROVAL: 'Pending_Approval',
  PAID: 'Paid',
} as const

export const API_EVENT_ATTENDANCE_STATUS = {
  REGISTERED: 'Registered',
  CONFIRMED: 'Confirmed',
  ATTENDED: 'Attended',
  CANCELLED: 'Cancelled',
} as const

export const API_EVENT_REGISTRATION_PATH = {
  NIAM: 'NIAM',
  UMUM: 'UMUM',
} as const

export const API_EVENT_REGISTRATION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  FULL: 'full',
} as const

export const API_EVENT_PAYMENT_METHOD = {
  MANUAL: 'manual',
  GATEWAY: 'gateway',
} as const

export const API_EVENT_FINANCE_TRANSACTION = {
  TYPE_INCOME: 'income',
  TYPE_EXPENSE: 'expense',
  SOURCE_MANUAL: 'manual',
  SOURCE_PAYMENT: 'payment',
  STATUS_POSTED: 'posted',
  STATUS_VOID: 'void',
} as const

function normalizedText(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

export function fromLaravelEventStatus(value: unknown): EventStatus {
  const normalized = normalizedText(value)

  if (normalized === 'draft') return 'draft'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'approved' || normalized === 'published') return 'published'
  if (normalized === 'live' || normalized === 'ongoing') return 'ongoing'
  if (normalized === 'finished' || normalized === 'completed') return 'completed'
  if (normalized === 'registration_closed') return 'registration_closed'
  if (normalized === 'rejected') return 'rejected'

  return 'draft'
}

export function toLaravelEventStatus(value: unknown): ApiEventStatus | undefined {
  const normalized = fromLaravelEventStatus(value)

  if (normalized === 'draft') return API_EVENT_STATUS.DRAFT
  if (normalized === 'pending') return API_EVENT_STATUS.PENDING
  if (normalized === 'published') return API_EVENT_STATUS.APPROVED
  if (normalized === 'ongoing') return API_EVENT_STATUS.LIVE
  if (normalized === 'completed') return API_EVENT_STATUS.FINISHED

  return undefined
}

export function normalizePaymentStatus(value: unknown): PaymentStatus {
  const normalized = normalizedText(value)

  if (normalized === 'free') return API_EVENT_PAYMENT_STATUS.FREE
  if (normalized === 'paid') return API_EVENT_PAYMENT_STATUS.PAID
  if (normalized === 'pending_approval' || normalized === 'pending-approval' || normalized === 'pending approval') {
    return API_EVENT_PAYMENT_STATUS.PENDING_APPROVAL
  }

  return API_EVENT_PAYMENT_STATUS.UNPAID
}

export function normalizeAttendanceStatus(value: unknown): AttendanceStatus {
  const normalized = normalizedText(value)

  if (normalized === 'attended') return API_EVENT_ATTENDANCE_STATUS.ATTENDED
  if (normalized === 'cancelled' || normalized === 'canceled') return API_EVENT_ATTENDANCE_STATUS.CANCELLED
  if (normalized === 'confirmed') return API_EVENT_ATTENDANCE_STATUS.CONFIRMED

  return API_EVENT_ATTENDANCE_STATUS.REGISTERED
}

export function normalizePaymentMethod(value: unknown) {
  return normalizedText(value) === API_EVENT_PAYMENT_METHOD.GATEWAY
    ? API_EVENT_PAYMENT_METHOD.GATEWAY
    : API_EVENT_PAYMENT_METHOD.MANUAL
}

export function normalizeRegistrationPath(value: unknown): RegistrationPath {
  return String(value ?? '').trim().toUpperCase() === API_EVENT_REGISTRATION_PATH.NIAM
    ? API_EVENT_REGISTRATION_PATH.NIAM
    : API_EVENT_REGISTRATION_PATH.UMUM
}

export function normalizeRegistrationStatus(value: unknown): RegistrationStatus | undefined {
  const normalized = normalizedText(value)
  if (normalized === API_EVENT_REGISTRATION_STATUS.OPEN) return API_EVENT_REGISTRATION_STATUS.OPEN
  if (normalized === API_EVENT_REGISTRATION_STATUS.CLOSED) return API_EVENT_REGISTRATION_STATUS.CLOSED
  if (normalized === API_EVENT_REGISTRATION_STATUS.FULL) return API_EVENT_REGISTRATION_STATUS.FULL
  return undefined
}

export function normalizeFinanceTransactionType(value: unknown): FinanceTransaction['type'] {
  return normalizedText(value) === API_EVENT_FINANCE_TRANSACTION.TYPE_EXPENSE
    ? API_EVENT_FINANCE_TRANSACTION.TYPE_EXPENSE
    : API_EVENT_FINANCE_TRANSACTION.TYPE_INCOME
}

export function normalizeFinanceTransactionSource(value: unknown): FinanceTransaction['source'] {
  return normalizedText(value) === API_EVENT_FINANCE_TRANSACTION.SOURCE_PAYMENT
    ? API_EVENT_FINANCE_TRANSACTION.SOURCE_PAYMENT
    : API_EVENT_FINANCE_TRANSACTION.SOURCE_MANUAL
}

export function normalizeFinanceTransactionStatus(value: unknown): FinanceTransaction['status'] {
  return normalizedText(value) === API_EVENT_FINANCE_TRANSACTION.STATUS_VOID
    ? API_EVENT_FINANCE_TRANSACTION.STATUS_VOID
    : API_EVENT_FINANCE_TRANSACTION.STATUS_POSTED
}
