import { NextRequest, NextResponse } from 'next/server'
import { getRegionalDashboard } from '@/lib/server/dashboard'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'analytics.read')
    const data = await getRegionalDashboard(session)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat dashboard regional'
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400 },
    )
  }
}
