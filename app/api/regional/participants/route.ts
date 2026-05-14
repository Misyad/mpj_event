import { NextRequest, NextResponse } from 'next/server'
import { createAdminParticipantInDb, getAdminParticipantsFromDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.read')
    const regionalId = requireRegionalScope(session, request.nextUrl.searchParams.get('regional_id'))
    const participants = await getAdminParticipantsFromDb({ scope: 'regional', regionId: regionalId })

    return NextResponse.json({ ok: true, data: participants })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === 'Unauthorized' ? 401 : 403 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.create')
    const regionalId = requireRegionalScope(session, null)
    const payload = await request.json()
    const eventId = String(payload.event_id || payload.eventId || '')
    if (!eventId) throw new Error('Event wajib dipilih')

    const result = await createAdminParticipantInDb(eventId, payload, {
      scope: 'regional',
      regionId: regionalId,
      userId: session.userId,
    })
    await recordAdminActivity(request, {
      action: 'regional_participant.created',
      entityType: 'participant',
      entityId: result.participant.id,
      metadata: { eventId, regionalId, registrationPath: result.participant.registration_path },
    })
    return NextResponse.json({ ok: true, data: result.participant, paymentCoreRequest: result.paymentCoreRequest }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal input peserta regional'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400 })
  }
}
