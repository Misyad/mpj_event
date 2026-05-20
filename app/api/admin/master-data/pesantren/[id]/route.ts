import { NextRequest, NextResponse } from 'next/server'
import { updateMasterPesantren } from '@/lib/server/master-data'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

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
    const actor = await requireAdminPermission(request, 'master-data.write')
    const data = await updateMasterPesantren(id, await request.json(), actor)
    if (!data) return NextResponse.json({ ok: false, error: 'Pesantren tidak ditemukan' }, { status: 404 })
    await recordAdminActivity(request, {
      action: 'master_pesantren.updated',
      entityType: 'master_pesantren',
      entityId: data.id,
      metadata: { name: data.name, region: data.region, status: data.status },
      permission: 'master-data.write',
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return masterDataError(error, 'Gagal mengubah pesantren')
  }
}
