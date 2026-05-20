import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { createAdminParticipantInDb, getAdminParticipantsFromDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.read')
    const participants = await getAdminParticipantsFromDb(
      session.role === AUTH_ROLES.regionalAdmin
        ? { scope: 'regional', regionId: session.regionalId }
        : {},
    )

    return NextResponse.json({ ok: true, data: participants })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat peserta'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.create')
    const payload = await request.json()
    const eventId = String(payload.event_id || payload.eventId || '')
    if (!eventId) throw new Error('Event wajib dipilih')

    const result = await createAdminParticipantInDb(
      eventId,
      payload,
      session.role === AUTH_ROLES.regionalAdmin
        ? { scope: 'regional', regionId: session.regionalId, userId: session.userId }
        : { userId: session.userId },
    )

    await recordAdminActivity(request, {
      action: 'admin_participant.created',
      entityType: 'participant',
      entityId: result.participant.id,
      metadata: { eventId, registrationPath: result.participant.registration_path },
    })

    return NextResponse.json({ ok: true, data: result.participant, paymentCoreRequest: result.paymentCoreRequest }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal input peserta'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
