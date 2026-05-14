import { NextRequest, NextResponse } from 'next/server'
import { createRegional, listRegionals, requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const activeOnly = request.nextUrl.searchParams.get('active') === '1'
    return NextResponse.json({ ok: true, data: await listRegionals({ activeOnly }) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const regional = await createRegional(request, {
      name: String(payload.name || ''),
      code: String(payload.code || ''),
    })
    return NextResponse.json({ ok: true, data: regional }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal membuat regional' },
      { status: 400 },
    )
  }
}
