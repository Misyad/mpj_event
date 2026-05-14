import { NextRequest, NextResponse } from 'next/server'
import { getEventFromDb, updateEventInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function regionalError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses event regional'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function assertRegionalEvent(request: NextRequest, id: string) {
  const session = await requireAdminPermission(request, 'events.update')
  const regionalId = requireRegionalScope(session, null)
  const event = await getEventFromDb(id)
  if (!event) throw new Error('Event tidak ditemukan')
  if (event.scope !== 'regional' || event.regionId !== regionalId) throw new Error('Regional scope tidak valid')
  return { event, regionalId }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const { event, regionalId } = await assertRegionalEvent(request, id)
    const status = String(event.status).toLowerCase()
    if (!['draft', 'rejected'].includes(status)) throw new Error('Event hanya bisa diedit saat Draft atau Ditolak')

    const payload = await request.json()
    const updated = await updateEventInDb(event.id, {
      ...payload,
      scope: 'regional',
      regionId: regionalId,
      region_id: regionalId,
      status: event.status,
    })
    if (!updated) throw new Error('Event tidak ditemukan')
    await recordAdminActivity(request, {
      action: 'regional_event.updated',
      entityType: 'event',
      entityId: updated.id,
      metadata: { title: updated.title, regionalId },
    })
    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    return regionalError(error)
  }
}
