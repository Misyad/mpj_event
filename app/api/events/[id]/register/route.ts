import { NextRequest, NextResponse } from 'next/server'
import { registerEventParticipant } from '@/lib/server/events'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getSessionFromRequest } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getSessionFromRequest(request, AUTH_ROLES.user)
    const result = await registerEventParticipant(id, await request.json(), {
      userId: session?.userId,
      fullName: session?.fullName,
      email: session?.email,
    })

    return NextResponse.json(
      {
        ok: true,
        data: result.participant,
        paymentCoreRequest: result.paymentCoreRequest,
        requiresPayment: Boolean(result.paymentCoreRequest),
        ticketCode: result.participant.ticketCode || result.participant.qr_token,
        status: result.participant.status,
        paymentStatus: result.participant.payment_status,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pendaftaran gagal'
    return jsonError(message, message === 'Event tidak ditemukan' ? 404 : 400)
  }
}
