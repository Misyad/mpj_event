import { NextRequest, NextResponse } from 'next/server'
import { listUnifiedAuditLogs } from '@/lib/server/audit-logs'
import { requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memuat audit log'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const params = request.nextUrl.searchParams
    const data = await listUnifiedAuditLogs({
      source: params.get('source') || undefined,
      action: params.get('action') || undefined,
      actor: params.get('actor') || undefined,
      entityType: params.get('entityType') || undefined,
      entityId: params.get('entityId') || undefined,
      dateStart: params.get('dateStart') || undefined,
      dateEnd: params.get('dateEnd') || undefined,
      q: params.get('q') || undefined,
      cursor: params.get('cursor') || undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
    })

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return jsonError(error)
  }
}
