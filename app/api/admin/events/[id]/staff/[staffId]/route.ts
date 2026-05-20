import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { deleteEventStaffFromDb, getEventFromDb, updateEventStaffInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string; staffId: string }>
}

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses panitia event'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('scope') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function assertEventScope(request: NextRequest, eventId: string) {
  const session = await requireAdminPermission(request, 'events.update')
  const event = await getEventFromDb(eventId)
  if (!event) throw new Error('Event tidak ditemukan')
  if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
    throw new Error('Regional scope tidak valid')
  }
  return event
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id, staffId } = await context.params

  try {
    const event = await assertEventScope(request, id)
    const data = await updateEventStaffInDb(event.id, staffId, await request.json())
    await recordAdminActivity(request, {
      action: 'event_staff.updated',
      entityType: 'event',
      entityId: event.id,
      metadata: { staffId: data.id, fullName: data.full_name, role: data.role },
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return adminError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id, staffId } = await context.params

  try {
    const event = await assertEventScope(request, id)
    await deleteEventStaffFromDb(event.id, staffId)
    await recordAdminActivity(request, {
      action: 'event_staff.deleted',
      entityType: 'event',
      entityId: event.id,
      metadata: { staffId },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return adminError(error)
  }
}
