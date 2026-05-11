import { NextRequest, NextResponse } from 'next/server'
import { getAdminActivity, requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireSuperAdmin(request)
    const { id } = await context.params
    return NextResponse.json({ ok: true, data: await getAdminActivity(id) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    )
  }
}
