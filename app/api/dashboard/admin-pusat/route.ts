import { NextRequest, NextResponse } from 'next/server'
import { getAdminPusatDashboard } from '@/lib/server/dashboard'
import { requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdmin(request)
    const data = await getAdminPusatDashboard(session)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat dashboard admin pusat'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
