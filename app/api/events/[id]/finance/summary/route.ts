import { NextRequest, NextResponse } from 'next/server'
import { getEventFinance } from '@/lib/server/finance'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await requireAdminPermission(request, 'events.read')
    const data = await getEventFinance(session, id)
    return NextResponse.json({ ok: true, data: data.summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat summary event'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
