import { NextRequest, NextResponse } from 'next/server'
import { updateRolePermissions } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const result = await updateRolePermissions(request, id, Array.isArray(payload.permissions) ? payload.permissions : [])
    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengubah permissions' },
      { status: 400 },
    )
  }
}
