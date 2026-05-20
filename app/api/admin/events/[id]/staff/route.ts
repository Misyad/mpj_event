import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { createEventStaffInDb, getEventFromDb, getEventStaffFromDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses panitia event'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('scope') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function assertEventScope(request: NextRequest, eventId: string, permission: 'events.read' | 'events.update') {
  const session = await requireAdminPermission(request, permission)
  const event = await getEventFromDb(eventId)
  if (!event) throw new Error('Event tidak ditemukan')
  if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
    throw new Error('Regional scope tidak valid')
  }
  return event
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    await assertEventScope(request, id, 'events.read')
    const data = await getEventStaffFromDb(id)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return adminError(error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const event = await assertEventScope(request, id, 'events.update')
    const data = await createEventStaffInDb(event.id, await request.json())
    await recordAdminActivity(request, {
      action: 'event_staff.created',
      entityType: 'event',
      entityId: event.id,
      metadata: { staffId: data.id, fullName: data.full_name, role: data.role },
    })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return adminError(error)
  }
}
