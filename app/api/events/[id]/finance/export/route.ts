import { NextRequest, NextResponse } from 'next/server'
import { getEventFinance, toCsv } from '@/lib/server/finance'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await requireAdminPermission(request, 'events.read')
    const data = await getEventFinance(session, id)
    const csv = toCsv(data.transactions.map((item) => ({
      tanggal: item.transactionDate,
      judul: item.title,
      kategori: item.categoryName,
      jenis: item.type,
      nominal: item.amount,
      status: item.status,
      source: item.source,
      paymentId: item.paymentId,
      proofUrl: item.proofUrl,
    })))
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="keuangan-event-${id}.csv"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal export event'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
