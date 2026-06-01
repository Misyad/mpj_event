import type { Event, Participant } from '@/types'
import { getEventDateInputParts } from '@/utils/dateFormatter'
import { API_EVENT_BASE_URL, ApiEventError, apiEventRequest, apiEventUrl, unwrapApiEventData } from './client'
import type { FinanceResponse, FinanceTransaction } from '@/components/finance/types'
import {
  API_EVENT_DEFAULT_BANK_ACCOUNT,
  API_EVENT_DEFAULT_POSTER_URL,
  API_EVENT_ATTENDANCE_STATUS,
  API_EVENT_PAYMENT_STATUS,
  API_EVENT_REGISTRATION_PATH,
  fromLaravelEventStatus,
  normalizeAttendanceStatus,
  normalizeFinanceTransactionSource,
  normalizeFinanceTransactionStatus,
  normalizeFinanceTransactionType,
  normalizePaymentStatus,
  normalizePaymentMethod,
  normalizeRegistrationPath,
  normalizeRegistrationStatus,
  toLaravelEventStatus,
} from './constants'

type ApiRecord = Record<string, unknown>
type LaravelEvent = ApiRecord
type LaravelParticipant = ApiRecord

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' ? value as ApiRecord : null
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function assetUrl(value: unknown, fallback: string) {
  const path = String(value ?? '').trim()
  if (!path) return fallback
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const origin = new URL(API_EVENT_BASE_URL).origin
  if (path.startsWith('/')) return `${origin}${path}`
  if (path.startsWith('storage/')) return `${origin}/${path}`

  return path
}

export function normalizeApiEvent(event: LaravelEvent): Event {
  const startDate = String(event.start_date ?? new Date().toISOString())
  const eventDateParts = getEventDateInputParts(startDate)
  const posterUrl = assetUrl(event.poster_path ?? event.poster_url, API_EVENT_DEFAULT_POSTER_URL)

  return {
    id: String(event.id),
    title: String(event.title ?? 'Event MPJ'),
    category: event.category === 'Seremonial' || event.category === 'Rapat' ? event.category : 'Pelatihan',
    poster_url: posterUrl,
    posterUrl,
    description: String(event.description ?? ''),
    location_gmaps: String(event.location_gmaps ?? ''),
    locationMapsUrl: String(event.location_gmaps ?? ''),
    location_name: String(event.location_name ?? ''),
    location: String(event.location_name ?? ''),
    start_date: startDate,
    dateStart: startDate,
    event_date: eventDateParts.date,
    eventDate: eventDateParts.date,
    event_time: eventDateParts.time,
    eventTime: eventDateParts.time,
    is_open_for_public: Boolean(event.is_open_for_public),
    allowPublic: Boolean(event.is_open_for_public),
    is_paid: Boolean(event.is_paid),
    isPaidEvent: Boolean(event.is_paid),
    payment_method: normalizePaymentMethod(event.payment_method),
    paymentMethod: normalizePaymentMethod(event.payment_method),
    gateway_provider: typeof event.gateway_provider === 'string' ? event.gateway_provider : null,
    gatewayProvider: typeof event.gateway_provider === 'string' ? event.gateway_provider : null,
    gateway_config: asRecord(event.gateway_config),
    gatewayConfig: asRecord(event.gateway_config),
    price_niam: Number(event.price_niam ?? 0),
    priceNiam: Number(event.price_niam ?? 0),
    price_public: Number(event.price_public ?? 0),
    priceUmum: Number(event.price_public ?? 0),
    status: fromLaravelEventStatus(event.status),
    bank_account: (asRecord(event.bank_account) as Event['bank_account'] | null) ?? API_EVENT_DEFAULT_BANK_ACCOUNT,
    max_participants: typeof event.max_participants === 'number' ? event.max_participants : undefined,
    quota: typeof event.max_participants === 'number' ? event.max_participants : undefined,
    current_participants: Number(event.current_participants ?? 0),
    registeredCount: Number(event.current_participants ?? 0),
    attendedCount: 0,
    status_pendaftaran: normalizeRegistrationStatus(event.status_pendaftaran),
    registration_deadline: typeof event.registration_deadline === 'string' ? event.registration_deadline : undefined,
    registrationDeadline: typeof event.registration_deadline === 'string' ? event.registration_deadline : undefined,
    speaker_id: typeof event.speaker_id === 'string' ? event.speaker_id : undefined,
    custom_fields: Array.isArray(event.custom_fields)
      ? event.custom_fields.map((value) => {
          const field = asRecord(value) ?? {}
          return {
            id: String(field.id),
            event_id: typeof field.event_id === 'string' ? field.event_id : undefined,
            label: String(field.label ?? ''),
            type: field.type === 'long_text' || field.type === 'radio' || field.type === 'dropdown' || field.type === 'checkbox' ? field.type : 'short_text',
            options: asStringArray(field.options),
            is_required: Boolean(field.is_required),
            order: Number(field.order ?? field.order_num ?? 0),
          }
        })
      : undefined,
    classes: undefined,
    certificateEnabled: false,
    certificateTemplateUrl: null,
    certificateTemplateName: null,
    certificateGeneratedCount: 0,
  }
}

function toLaravelEventPayload(payload: Record<string, unknown>) {
  const status = payload.status ? toLaravelEventStatus(payload.status) : undefined
  if (payload.status && !status) {
    throw new ApiEventError('Status event belum didukung Laravel api-event', 422, { status: payload.status })
  }

  return {
    title: payload.title,
    category: payload.category,
    event_type: payload.event_type ?? 'Non-Kelas',
    description: payload.description,
    location_name: payload.location_name ?? payload.location,
    location_gmaps: payload.location_gmaps ?? payload.locationMapsUrl,
    start_date: payload.start_date ?? payload.dateStart,
    registration_deadline: payload.registration_deadline ?? payload.registrationDeadline,
    is_open_for_public: Boolean(payload.is_open_for_public ?? payload.allowPublic),
    is_paid: Boolean(payload.is_paid ?? payload.isPaidEvent),
    price_niam: Number(payload.price_niam ?? payload.priceNiam ?? 0),
    price_public: Number(payload.price_public ?? payload.priceUmum ?? 0),
    max_participants: payload.max_participants ?? payload.quota ?? null,
    status,
    payment_method: normalizePaymentMethod(payload.payment_method),
    speaker_id: typeof payload.speaker_id === 'string' && payload.speaker_id ? payload.speaker_id : null,
  }
}

export function normalizeApiParticipant(participant: LaravelParticipant): Participant {
  const paymentStatus = normalizePaymentStatus(participant.payment_status)
  const attendanceStatus = normalizeAttendanceStatus(participant.attendance_status)
  const activeTicket = paymentStatus === API_EVENT_PAYMENT_STATUS.PAID || paymentStatus === API_EVENT_PAYMENT_STATUS.FREE
  const registrationPath = normalizeRegistrationPath(participant.registration_path)
  const payment = asRecord(participant.payment)
  const guest = asRecord(participant.guest)
  const crew = asRecord(participant.crew)

  return {
    id: String(participant.id),
    event_id: String(participant.event_id),
    eventId: String(participant.event_id),
    registration_path: registrationPath,
    type: registrationPath === API_EVENT_REGISTRATION_PATH.NIAM ? 'niam' : 'umum',
    payment_status: paymentStatus,
    unique_amount: Number(participant.unique_amount ?? payment?.amount ?? 0),
    payment_proof_url: typeof participant.payment_proof_preview_url === 'string'
      ? participant.payment_proof_preview_url
      : typeof participant.payment_proof_path === 'string'
        ? participant.payment_proof_path
        : typeof payment?.preview_url === 'string'
          ? payment.preview_url
          : null,
    payment_proof_name: null,
    payment_proof_mime: null,
    payment_proof_size: null,
    payment_proof_uploaded_at: typeof payment?.submitted_at === 'string' ? payment.submitted_at : null,
    attendance_status: attendanceStatus,
    status: activeTicket && attendanceStatus === API_EVENT_ATTENDANCE_STATUS.REGISTERED ? API_EVENT_ATTENDANCE_STATUS.CONFIRMED : attendanceStatus,
    qr_token: String(participant.qr_token ?? ''),
    ticketCode: String(participant.qr_token ?? ''),
    paymentId: typeof payment?.id === 'string' ? payment.id : null,
    payment: payment
      ? {
          id: typeof payment.id === 'string' ? payment.id : null,
          method: null,
          channel: null,
          status: typeof payment.status === 'string' ? payment.status : null,
          paymentProof: typeof payment.preview_url === 'string'
            ? {
                url: payment.preview_url,
                uploadedAt: typeof payment.submitted_at === 'string' ? payment.submitted_at : null,
              }
            : null,
        }
      : null,
    full_name: String(participant.display_name ?? guest?.full_name ?? crew?.full_name ?? ''),
    fullName: String(participant.display_name ?? guest?.full_name ?? crew?.full_name ?? ''),
    institution_name: typeof guest?.institution_name === 'string' ? guest.institution_name : typeof crew?.unit === 'string' ? crew.unit : undefined,
    institution: typeof guest?.institution_name === 'string' ? guest.institution_name : typeof crew?.unit === 'string' ? crew.unit : undefined,
    whatsapp: typeof guest?.whatsapp === 'string' ? guest.whatsapp : undefined,
    attendedAt: typeof participant.attended_at === 'string' ? participant.attended_at : null,
    crew: (crew as Participant['crew'] | null) ?? undefined,
    guest: (guest as Participant['guest'] | null) ?? undefined,
  }
}

export async function getEventsFromApiEvent(): Promise<Event[]> {
  const payload = await apiEventRequest<unknown>('/event')
  const events = unwrapApiEventData<LaravelEvent[]>(payload)
  return (Array.isArray(events) ? events : []).map(normalizeApiEvent)
}

export async function getAdminEventsFromApiEvent(): Promise<Event[]> {
  const payload = await apiEventRequest<unknown>('/event/admin/list', { admin: true })
  const events = unwrapApiEventData<LaravelEvent[]>(payload)
  return (Array.isArray(events) ? events : []).map(normalizeApiEvent)
}

export async function getAdminEventFromApiEvent(eventId: string) {
  const payload = await apiEventRequest<unknown>(`/event/admin/${encodeURIComponent(eventId)}`, { admin: true })
  return normalizeApiEvent(unwrapApiEventData<LaravelEvent>(payload))
}

export async function createAdminEventWithApiEvent(payload: Record<string, unknown>) {
  const response = await apiEventRequest<unknown>('/event/admin', {
    method: 'POST',
    admin: true,
    body: JSON.stringify(toLaravelEventPayload(payload)),
  })
  return normalizeApiEvent(unwrapApiEventData<LaravelEvent>(response))
}

export async function updateAdminEventWithApiEvent(eventId: string, payload: Record<string, unknown>) {
  const response = await apiEventRequest<unknown>(`/event/admin/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    admin: true,
    body: JSON.stringify(toLaravelEventPayload(payload)),
  })
  return normalizeApiEvent(unwrapApiEventData<LaravelEvent>(response))
}

export async function changeAdminEventStatusWithApiEvent(eventId: string, status: unknown) {
  const laravelStatus = toLaravelEventStatus(status)
  if (!laravelStatus) {
    throw new ApiEventError('Status event belum didukung Laravel api-event', 422, { status })
  }

  const response = await apiEventRequest<unknown>(`/event/admin/${encodeURIComponent(eventId)}/status`, {
    method: 'PATCH',
    admin: true,
    body: JSON.stringify({ status: laravelStatus }),
  })
  return normalizeApiEvent(unwrapApiEventData<LaravelEvent>(response))
}

export async function uploadAdminEventPosterWithApiEvent(eventId: string, file: File) {
  const body = new FormData()
  body.append('poster', file)
  const response = await apiEventRequest<Record<string, unknown>>(`/event/admin/${encodeURIComponent(eventId)}/poster`, {
    method: 'POST',
    admin: true,
    body,
  })
  return String(response.url ?? '')
}

export async function getAdminEventParticipantsFromApiEvent(eventId: string): Promise<Participant[]> {
  const payload = await apiEventRequest<unknown>(`/event/admin/${encodeURIComponent(eventId)}/participants`, { admin: true })
  const participants = unwrapApiEventData<LaravelParticipant[]>(payload)
  return (Array.isArray(participants) ? participants : []).map(normalizeApiParticipant)
}

export async function getEventFromApiEvent(id: string): Promise<Event | null> {
  try {
    const payload = await apiEventRequest<unknown>(`/event/${encodeURIComponent(id)}`)
    return normalizeApiEvent(unwrapApiEventData<LaravelEvent>(payload))
  } catch {
    return null
  }
}

export async function validateNiamWithApiEvent(niam: string) {
  const payload = await apiEventRequest<ApiRecord>(`/event/niam/validate/${encodeURIComponent(niam)}`)
  const crew = asRecord(payload.crew)
  return {
    valid: Boolean(payload.valid && crew),
    data: crew
      ? {
          id: String(crew.id),
          niam: String(crew.niam),
          fullName: String(crew.full_name ?? ''),
          unit: String(crew.unit ?? ''),
          photoUrl: typeof crew.photo_path === 'string' ? crew.photo_path : null,
        }
      : null,
  }
}

export async function registerEventWithApiEvent(eventId: string, payload: Record<string, unknown>) {
  const response = await apiEventRequest<unknown>(`/event/${encodeURIComponent(eventId)}/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const participant = normalizeApiParticipant(unwrapApiEventData<LaravelParticipant>(response))
  return {
    participant,
    requiresPayment: participant.payment_status === API_EVENT_PAYMENT_STATUS.UNPAID || participant.payment_status === API_EVENT_PAYMENT_STATUS.PENDING_APPROVAL,
    paymentId: participant.paymentId,
    ticketCode: participant.qr_token,
    paymentStatus: participant.payment_status,
  }
}

export async function uploadPaymentProofWithApiEvent(qrToken: string, file: File) {
  const body = new FormData()
  body.append('qr_token', qrToken)
  body.append('payment_proof', file)

  const response = await apiEventRequest<unknown>('/event/payment/proof', {
    method: 'POST',
    body,
  })

  return normalizeApiParticipant(unwrapApiEventData<LaravelParticipant>(response))
}

export async function getTicketFromApiEvent(token: string) {
  const response = await apiEventRequest<unknown>(`/event/ticket/${encodeURIComponent(token)}`)
  const rawParticipant = unwrapApiEventData<LaravelParticipant>(response)
  const participant = normalizeApiParticipant(rawParticipant)
  const event = rawParticipant.event ? normalizeApiEvent(rawParticipant.event as LaravelEvent) : null

  return { participant, event }
}

export async function approvePaymentWithApiEvent(paymentId: string) {
  const response = await apiEventRequest<unknown>(`/event/payment/${encodeURIComponent(paymentId)}/approve`, {
    method: 'POST',
    admin: true,
  })
  return normalizeApiParticipant(unwrapApiEventData<LaravelParticipant>(response))
}

export async function rejectPaymentWithApiEvent(paymentId: string, reason?: string | null) {
  const response = await apiEventRequest<unknown>(`/event/payment/${encodeURIComponent(paymentId)}/reject`, {
    method: 'POST',
    admin: true,
    body: JSON.stringify({ reason: reason ?? null }),
  })
  return normalizeApiParticipant(unwrapApiEventData<LaravelParticipant>(response))
}

function normalizeFinanceTransaction(value: ApiRecord): FinanceTransaction {
  return {
    id: String(value.id),
    type: normalizeFinanceTransactionType(value.type),
    source: normalizeFinanceTransactionSource(value.source),
    categoryId: '',
    categoryName: null,
    paymentId: typeof value.payment_id === 'string' ? value.payment_id : null,
    amount: Number(value.amount ?? 0),
    title: String(value.title ?? ''),
    description: typeof value.description === 'string' ? value.description : null,
    transactionDate: typeof value.transaction_date === 'string' ? value.transaction_date : null,
    proofUrl: null,
    status: normalizeFinanceTransactionStatus(value.status),
  }
}

export async function getEventFinanceFromApiEvent(eventId: string): Promise<FinanceResponse> {
  const [summaryPayload, transactionsPayload] = await Promise.all([
    apiEventRequest<unknown>(`/event/finance/summary?event_id=${encodeURIComponent(eventId)}`, { admin: true }),
    apiEventRequest<unknown>(`/event/${encodeURIComponent(eventId)}/finance/transactions`, { admin: true }),
  ])
  const summary = unwrapApiEventData<ApiRecord>(summaryPayload)
  const transactions = unwrapApiEventData<ApiRecord[]>(transactionsPayload)
  const eventTransactions = (Array.isArray(transactions) ? transactions : []).map(normalizeFinanceTransaction)

  return {
    summary: {
      totalIncome: Number(summary.income ?? 0),
      totalExpense: Number(summary.expense ?? 0),
      balance: Number(summary.balance ?? 0),
      transactionCount: eventTransactions.length,
    },
    transactions: eventTransactions,
    categories: [],
  }
}

export async function saveEventFinanceTransactionWithApiEvent(eventId: string, payload: Record<string, unknown>, transactionId?: string | null) {
  const body = {
    type: payload.type,
    title: payload.title,
    description: payload.description,
    amount: payload.amount,
    transaction_date: payload.transactionDate || undefined,
  }
  const response = await apiEventRequest<unknown>(
    transactionId
      ? `/event/${encodeURIComponent(eventId)}/finance/transactions/${encodeURIComponent(transactionId)}`
      : `/event/${encodeURIComponent(eventId)}/finance/transactions`,
    {
      method: transactionId ? 'PUT' : 'POST',
      admin: true,
      body: JSON.stringify(body),
    },
  )
  return normalizeFinanceTransaction(unwrapApiEventData<ApiRecord>(response))
}

export async function voidEventFinanceTransactionWithApiEvent(eventId: string, transactionId: string) {
  await apiEventRequest<unknown>(`/event/${encodeURIComponent(eventId)}/finance/transactions/${encodeURIComponent(transactionId)}/void`, {
    method: 'POST',
    admin: true,
  })
}

export async function getFinanceSummaryFromApiEvent() {
  const payload = await apiEventRequest<unknown>('/event/finance/summary', { admin: true })
  const summary = unwrapApiEventData<ApiRecord>(payload)
  return {
    totalIncome: Number(summary.income ?? 0),
    totalExpense: Number(summary.expense ?? 0),
    balance: Number(summary.balance ?? 0),
    eventCount: 0,
    transactionCount: 0,
  }
}

export async function getFinanceRecapFromApiEvent() {
  const payload = await apiEventRequest<unknown>('/event/finance/recap', { admin: true })
  const rows = unwrapApiEventData<ApiRecord[]>(payload)
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const event = asRecord(row.event) ?? {}
    const finance = asRecord(row.finance) ?? {}
    const income = Number(finance.income ?? 0)
    const expense = Number(finance.expense ?? 0)
    return {
      eventId: String(event.id ?? ''),
      eventTitle: String(event.title ?? ''),
      scope: 'pusat',
      regionId: null,
      totalIncome: income,
      totalExpense: expense,
      balance: Number(finance.balance ?? income - expense),
      transactionCount: 0,
    }
  })
}

export { apiEventUrl }
