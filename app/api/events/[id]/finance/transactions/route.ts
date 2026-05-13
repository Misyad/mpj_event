import { NextRequest, NextResponse } from 'next/server'
import { createManualFinanceTransaction, getEventFinance } from '@/lib/server/finance'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses transaksi event'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await requireAdminPermission(request, 'events.read')
    const params = request.nextUrl.searchParams
    const data = await getEventFinance(session, id, {
      type: params.get('type') || undefined,
      categoryId: params.get('categoryId') || undefined,
      dateStart: params.get('dateStart') || undefined,
      dateEnd: params.get('dateEnd') || undefined,
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await requireAdminPermission(request, 'events.update')
    const data = await createManualFinanceTransaction(session, id, await request.json())
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
