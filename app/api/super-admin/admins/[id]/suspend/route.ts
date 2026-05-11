import { NextRequest, NextResponse } from 'next/server'
import { updateRegionalAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const admin = await updateRegionalAdmin(request, id, { status: 'suspended' })
    return NextResponse.json({ ok: true, data: admin })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal suspend admin' },
      { status: 400 },
    )
  }
}
