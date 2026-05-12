import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { confirmParticipantManually, getEventFromDb } from '@/lib/server/events'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string; participantId: string }>
}

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal confirm peserta'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') || message.includes('scope') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id, participantId } = await context.params

  try {
    const session = await requireAdminPermission(request, 'events.update')
    const event = await getEventFromDb(id)
    if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })
    if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
      throw new Error('Regional scope tidak valid')
    }

    const participant = await confirmParticipantManually(event.id, participantId)
    return NextResponse.json({ ok: true, data: participant })
  } catch (error) {
    return adminError(error)
  }
}
