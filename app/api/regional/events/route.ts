import { NextRequest, NextResponse } from 'next/server'
import { createEventInDb, getEventsFromDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const regionalId = requireRegionalScope(session, request.nextUrl.searchParams.get('regional_id'))
    const events = await getEventsFromDb()
    return NextResponse.json({
      ok: true,
      data: regionalId ? events.filter((event) => event.scope === 'regional' && event.regionId === regionalId) : events,
    })
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
    const session = await requireAdminPermission(request, 'events.create')
    const regionalId = requireRegionalScope(session, null)
    const payload = await request.json()
    const event = await createEventInDb({
      ...payload,
      status: payload.status ?? 'draft',
      scope: 'regional',
      regionId: regionalId,
      region_id: regionalId,
      isPublished: false,
      is_published: false,
    })
    await recordAdminActivity(request, {
      action: 'regional_event.created',
      entityType: 'event',
      entityId: event.id,
      metadata: { title: event.title, regionalId },
    })
    return NextResponse.json({ ok: true, data: event }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat event regional'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400 })
  }
}
