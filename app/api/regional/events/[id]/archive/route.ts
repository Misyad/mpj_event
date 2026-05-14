import { NextRequest, NextResponse } from 'next/server'
import { getEventFromDb, updateEventInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const session = await requireAdminPermission(request, 'events.update')
    const regionalId = requireRegionalScope(session, null)
    const event = await getEventFromDb(id)
    if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })
    if (event.scope !== 'regional' || event.regionId !== regionalId) throw new Error('Regional scope tidak valid')
    if (['approved', 'live'].includes(String(event.status).toLowerCase())) throw new Error('Event yang sudah published tidak bisa diarsipkan oleh regional')

    const updated = await updateEventInDb(event.id, {
      status: 'registration_closed',
      scope: 'regional',
      regionId: regionalId,
      region_id: regionalId,
    })
    await recordAdminActivity(request, {
      action: 'regional_event.archived',
      entityType: 'event',
      entityId: event.id,
      metadata: { title: event.title, previousStatus: event.status, nextStatus: 'registration_closed', regionalId },
    })
    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengarsipkan event'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400 })
  }
}
