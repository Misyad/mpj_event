import { NextRequest, NextResponse } from 'next/server'
import { createRegionalAdmin, listRegionalAdmins, requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    return NextResponse.json({ ok: true, data: await listRegionalAdmins() })
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
    const admin = await createRegionalAdmin(request, {
      fullName: String(payload.fullName || payload.full_name || ''),
      email: String(payload.email || ''),
      password: payload.password ? String(payload.password) : undefined,
      regionalId: String(payload.regionalId || payload.regional_id || ''),
    })
    return NextResponse.json({ ok: true, data: admin }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal membuat admin regional' },
      { status: 400 },
    )
  }
}
