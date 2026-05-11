import { NextRequest, NextResponse } from 'next/server'
import { getEventsFromDb } from '@/lib/server/events'
import { requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const regionalId = requireRegionalScope(session, request.nextUrl.searchParams.get('regional_id'))
    const events = await getEventsFromDb()
    return NextResponse.json({
      ok: true,
      data: regionalId ? events.filter((event) => event.regionId === regionalId) : events,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    )
  }
}
