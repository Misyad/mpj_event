import { NextRequest, NextResponse } from 'next/server'
import { registerEventParticipant } from '@/lib/server/events'

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
    const result = await registerEventParticipant(id, await request.json())

    return NextResponse.json(
      {
        ok: true,
        data: result.participant,
        paymentCoreRequest: result.paymentCoreRequest,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pendaftaran gagal'
    return jsonError(message, message === 'Event tidak ditemukan' ? 404 : 400)
  }
}
