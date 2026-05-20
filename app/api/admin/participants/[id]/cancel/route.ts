import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { cancelAdminParticipantInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const session = await requireAdminPermission(request, 'participants.update')
    const data = await cancelAdminParticipantInDb(
      id,
      session.role === AUTH_ROLES.regionalAdmin
        ? { scope: 'regional', regionId: session.regionalId }
        : {},
    )
    if (!data) return NextResponse.json({ ok: false, error: 'Peserta tidak ditemukan' }, { status: 404 })

    await recordAdminActivity(request, {
      action: 'admin_participant.cancelled',
      entityType: 'participant',
      entityId: data.id,
      metadata: { eventId: data.event_id },
    })

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan peserta'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
