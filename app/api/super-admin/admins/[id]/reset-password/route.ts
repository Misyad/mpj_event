import { NextRequest, NextResponse } from 'next/server'
import { resetRegionalAdminPassword } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const result = await resetRegionalAdminPassword(request, id)
    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal reset password admin' },
      { status: 400 },
    )
  }
}
