import { NextRequest, NextResponse } from 'next/server'
import { updateMasterMedia } from '@/lib/server/master-data'
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
    const data = await updateMasterMedia(id, await request.json())
    if (!data) return NextResponse.json({ ok: false, error: 'Media tidak ditemukan' }, { status: 404 })
    await recordAdminActivity(request, {
      action: 'master_media.updated',
      entityType: 'master_media',
      entityId: data.id,
      metadata: { name: data.name, region: data.region, status: data.status },
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return masterDataError(error, 'Gagal mengubah media')
  }
}
