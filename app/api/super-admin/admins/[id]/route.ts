import { NextRequest, NextResponse } from 'next/server'
import { updateRegionalAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const admin = await updateRegionalAdmin(request, id, {
      fullName: payload.fullName || payload.full_name,
      regionalId: payload.regionalId || payload.regional_id,
      status: payload.status,
    })
    return NextResponse.json({ ok: true, data: admin })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengubah admin regional' },
      { status: 400 },
    )
  }
}
