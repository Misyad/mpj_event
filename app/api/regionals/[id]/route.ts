import { NextRequest, NextResponse } from 'next/server'
import { updateRegional } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await request.json()
    const regional = await updateRegional(request, id, {
      name: payload.name === undefined ? undefined : String(payload.name),
      code: payload.code === undefined ? undefined : String(payload.code),
      status: payload.status === undefined ? undefined : String(payload.status),
    })
    return NextResponse.json({ ok: true, data: regional })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengubah regional' },
      { status: 400 },
    )
  }
}
