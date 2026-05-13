import { NextRequest, NextResponse } from 'next/server'
import { voidManualFinanceTransaction } from '@/lib/server/finance'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string; transactionId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id, transactionId } = await context.params
    const session = await requireAdminPermission(request, 'events.update')
    const data = await voidManualFinanceTransaction(session, id, transactionId)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal void transaksi'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
