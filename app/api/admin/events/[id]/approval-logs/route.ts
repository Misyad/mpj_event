import { NextRequest, NextResponse } from 'next/server'
import { getEventFromDb } from '@/lib/server/events'
import { getEntityActivityLogs, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memuat riwayat approval'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    await requireAdminPermission(request, 'events.read')
    const event = await getEventFromDb(id)
    if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })

    const data = await getEntityActivityLogs('event', event.id, [
      'event.approval_approved',
      'event.approval_rejected',
    ])
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return adminError(error)
  }
}
