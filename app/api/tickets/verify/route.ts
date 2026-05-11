import { NextRequest, NextResponse } from 'next/server'
import { getEventFromDb, getParticipantByTicketCode } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const ticketCode = String(payload.ticketCode || payload.qr_token || payload.token || '').trim()

    if (!ticketCode) {
      return NextResponse.json({ ok: false, error: 'Ticket code is required' }, { status: 400 })
    }

    const participant = await getParticipantByTicketCode(ticketCode)
    if (!participant) {
      return NextResponse.json({ ok: false, error: 'Ticket token not found' }, { status: 404 })
    }

    const event = await getEventFromDb(participant.event_id)
    return NextResponse.json({ ok: true, data: participant, event })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid ticket request' },
      { status: 400 },
    )
  }
}
