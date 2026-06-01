'use server'

import { ApiEventError } from './client'
import { checkInAttendanceWithApiEvent, verifyAttendanceTicketWithApiEvent } from './attendance'
import {
  changeAdminEventStatusWithApiEvent,
  createAdminEventWithApiEvent,
  getAdminEventFromApiEvent,
  getAdminEventParticipantsFromApiEvent,
  getAdminEventsFromApiEvent,
  getEventFinanceFromApiEvent,
  getFinanceRecapFromApiEvent,
  getFinanceSummaryFromApiEvent,
  getTicketFromApiEvent,
  registerEventWithApiEvent,
  saveEventFinanceTransactionWithApiEvent,
  updateAdminEventWithApiEvent,
  uploadAdminEventPosterWithApiEvent,
  uploadPaymentProofWithApiEvent,
  validateNiamWithApiEvent,
  voidEventFinanceTransactionWithApiEvent,
} from './events'

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number }

function actionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiEventError) {
    return { ok: false, error: error.message, status: error.status }
  }

  return { ok: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan', status: 500 }
}

export async function validateNiamAction(niam: string) {
  try {
    return { ok: true, data: await validateNiamWithApiEvent(niam) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function registerEventAction(eventId: string, payload: Record<string, unknown>) {
  try {
    return { ok: true, data: await registerEventWithApiEvent(eventId, payload) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function uploadPaymentProofAction(qrToken: string, formData: FormData) {
  try {
    const file = formData.get('payment_proof')
    if (!(file instanceof File)) {
      return { ok: false, error: 'File bukti transfer wajib diupload', status: 422 } as const
    }

    return { ok: true, data: await uploadPaymentProofWithApiEvent(qrToken, file) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function verifyTicketAction(token: string) {
  try {
    return { ok: true, data: await getTicketFromApiEvent(token) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function getAdminEventsAction() {
  try {
    return { ok: true, data: await getAdminEventsFromApiEvent() } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function createAdminEventAction(payload: Record<string, unknown>, posterForm?: FormData | null) {
  try {
    let event = await createAdminEventWithApiEvent(payload)
    const poster = posterForm?.get('poster')
    if (poster instanceof File) {
      await uploadAdminEventPosterWithApiEvent(event.id, poster)
      event = await getAdminEventFromApiEvent(event.id)
    }
    return { ok: true, data: event } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function updateAdminEventAction(eventId: string, payload: Record<string, unknown>, posterForm?: FormData | null) {
  try {
    let event = await updateAdminEventWithApiEvent(eventId, payload)
    const poster = posterForm?.get('poster')
    if (poster instanceof File) {
      await uploadAdminEventPosterWithApiEvent(event.id, poster)
      event = await getAdminEventFromApiEvent(event.id)
    }
    return { ok: true, data: event } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function changeAdminEventStatusAction(eventId: string, status: unknown) {
  try {
    return { ok: true, data: await changeAdminEventStatusWithApiEvent(eventId, status) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function getAdminEventParticipantsAction(eventId: string) {
  try {
    return { ok: true, data: await getAdminEventParticipantsFromApiEvent(eventId) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function getEventFinanceAction(eventId: string) {
  try {
    return { ok: true, data: await getEventFinanceFromApiEvent(eventId) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function saveEventFinanceTransactionAction(eventId: string, payload: Record<string, unknown>, transactionId?: string | null) {
  try {
    return { ok: true, data: await saveEventFinanceTransactionWithApiEvent(eventId, payload, transactionId) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function voidEventFinanceTransactionAction(eventId: string, transactionId: string) {
  try {
    await voidEventFinanceTransactionWithApiEvent(eventId, transactionId)
    return { ok: true, data: null } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function getFinanceRecapAction() {
  try {
    const [summary, rows] = await Promise.all([
      getFinanceSummaryFromApiEvent(),
      getFinanceRecapFromApiEvent(),
    ])
    return { ok: true, data: { summary, rows } } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function verifyAttendanceTicketAction(token: string) {
  try {
    return { ok: true, data: await verifyAttendanceTicketWithApiEvent(token) } as const
  } catch (error) {
    return actionError(error)
  }
}

export async function checkInAttendanceAction(qrToken: string, scannerName?: string | null, scannerDevice?: string | null) {
  try {
    return {
      ok: true,
      data: await checkInAttendanceWithApiEvent({ qrToken, scannerName, scannerDevice }),
    } as const
  } catch (error) {
    return actionError(error)
  }
}
