import { NextRequest, NextResponse } from 'next/server'
import { updateAdminParticipantInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const session = await requireAdminPermission(request, 'participants.update')
    const regionalId = requireRegionalScope(session, null)
    const data = await updateAdminParticipantInDb(id, await request.json(), { scope: 'regional', regionId: regionalId })
    if (!data) return NextResponse.json({ ok: false, error: 'Peserta tidak ditemukan' }, { status: 404 })
    await recordAdminActivity(request, {
      action: 'regional_participant.updated',
      entityType: 'participant',
      entityId: data.id,
      metadata: { eventId: data.event_id, regionalId },
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah peserta'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400 })
  }
}
