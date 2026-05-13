import { NextRequest, NextResponse } from 'next/server'
import { getFinanceSummary } from '@/lib/server/finance'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const params = request.nextUrl.searchParams
    const data = await getFinanceSummary(session, {
      eventId: params.get('eventId') || undefined,
      dateStart: params.get('dateStart') || undefined,
      dateEnd: params.get('dateEnd') || undefined,
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat summary keuangan'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
