import { NextRequest, NextResponse } from 'next/server'
import { getAdminParticipantsFromDb } from '@/lib/server/events'
import { requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.read')
    const regionalId = requireRegionalScope(session, request.nextUrl.searchParams.get('regional_id'))
    const participants = await getAdminParticipantsFromDb({ scope: 'regional', regionId: regionalId })

    return NextResponse.json({ ok: true, data: participants })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === 'Unauthorized' ? 401 : 403 },
    )
  }
}
