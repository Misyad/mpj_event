import { NextRequest, NextResponse } from 'next/server'
import { createMasterPesantren, listMasterPesantren } from '@/lib/server/master-data'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function masterDataError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, 'master-data.read')
    return NextResponse.json({ ok: true, data: await listMasterPesantren(actor) })
  } catch (error) {
    return masterDataError(error, 'Gagal memuat pesantren')
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdminPermission(request, 'master-data.write')
    const data = await createMasterPesantren(await request.json(), actor)
    await recordAdminActivity(request, {
      action: 'master_pesantren.created',
      entityType: 'master_pesantren',
      entityId: data.id,
      metadata: { name: data.name, region: data.region },
      permission: 'master-data.write',
    })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return masterDataError(error, 'Gagal membuat pesantren')
  }
}
