import { NextRequest, NextResponse } from 'next/server'
import { checkInTicket } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const ticketCode = String(payload.ticketCode || payload.qr_token || payload.token || '').trim()

    if (!ticketCode) {
      return NextResponse.json({ ok: false, error: 'Ticket code is required' }, { status: 400 })
    }

    const result = await checkInTicket(ticketCode)
    return NextResponse.json({
      ok: true,
      data: result.participant,
      warning: result.warning,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'QR tidak valid'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Ticket token not found' ? 404 : 400 })
  }
}
