import { NextRequest, NextResponse } from 'next/server'
import { updateMasterCrew } from '@/lib/server/master-data'
import { recordAdminActivity, requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function masterDataError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    await requireSuperAdmin(request)
    const data = await updateMasterCrew(id, await request.json())
    if (!data) return NextResponse.json({ ok: false, error: 'Kru tidak ditemukan' }, { status: 404 })
    await recordAdminActivity(request, {
      action: 'master_crew.updated',
      entityType: 'crew_member',
      entityId: data.id,
      metadata: { niam: data.niam, name: data.full_name, unit: data.unit },
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return masterDataError(error, 'Gagal mengubah kru')
  }
}
