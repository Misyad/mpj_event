import { NextRequest, NextResponse } from 'next/server'
import { createEventInDb, getEventsFromDb } from '@/lib/server/events'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unauthorized'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const events = await getEventsFromDb()
    const data =
      session.role === AUTH_ROLES.regionalAdmin
        ? events.filter((event) => event.scope === 'regional' && event.regionId === session.regionalId)
        : events
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return adminError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.create')
    const payload = await request.json()
    const eventPayload =
      session.role === AUTH_ROLES.regionalAdmin
        ? {
            ...payload,
            scope: 'regional',
            regionId: requireRegionalScope(session, payload.regionId ?? payload.region_id),
            region_id: requireRegionalScope(session, payload.regionId ?? payload.region_id),
          }
        : payload
    const event = await createEventInDb(eventPayload)
    return NextResponse.json({ ok: true, data: event }, { status: 201 })
  } catch (error) {
    return adminError(error)
  }
}
