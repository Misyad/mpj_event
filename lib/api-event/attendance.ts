import type { Participant } from '@/types'
import { apiEventRequest, unwrapApiEventData } from './client'
import { normalizeApiParticipant } from './events'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {}
}

export type AttendanceCheckInPayload = {
  qrToken: string
  scannerName?: string | null
  scannerDevice?: string | null
}

export type AttendanceCheckInResult = {
  success: boolean
  message: string
  participant: Participant | null
}

export async function verifyAttendanceTicketWithApiEvent(token: string) {
  const payload = await apiEventRequest<unknown>(`/event/attendance/verify/${encodeURIComponent(token)}`, { admin: true })
  const record = asRecord(payload)
  return {
    valid: Boolean(record.valid),
    participant: record.participant ? normalizeApiParticipant(record.participant as ApiRecord) : null,
  }
}

export async function checkInAttendanceWithApiEvent(payload: AttendanceCheckInPayload): Promise<AttendanceCheckInResult> {
  const response = await apiEventRequest<unknown>('/event/attendance/check-in', {
    method: 'POST',
    admin: true,
    body: JSON.stringify({
      qr_token: payload.qrToken,
      scanner_name: payload.scannerName ?? undefined,
      scanner_device: payload.scannerDevice ?? undefined,
    }),
  })
  const record = asRecord(response)
  return {
    success: Boolean(record.success),
    message: typeof record.message === 'string' ? record.message : 'Check-in diproses.',
    participant: record.participant ? normalizeApiParticipant(record.participant as ApiRecord) : null,
  }
}

export async function getAttendanceLogWithApiEvent(eventId: string) {
  const payload = await apiEventRequest<unknown>(`/event/attendance/${encodeURIComponent(eventId)}/log`, { admin: true })
  const rows = unwrapApiEventData<unknown[]>(payload)
  return (Array.isArray(rows) ? rows : []).map((row) => normalizeApiParticipant(row as ApiRecord))
}
