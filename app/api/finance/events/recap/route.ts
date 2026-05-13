import { NextRequest, NextResponse } from 'next/server'
import { listFinanceRecap, toCsv } from '@/lib/server/finance'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const params = request.nextUrl.searchParams
    const data = await listFinanceRecap(session, {
      eventId: params.get('eventId') || undefined,
      dateStart: params.get('dateStart') || undefined,
      dateEnd: params.get('dateEnd') || undefined,
    })

    if (params.get('export') === 'csv') {
      const csv = toCsv(data.map((item) => ({
        eventId: item.eventId,
        event: item.eventTitle,
        scope: item.scope,
        regionId: item.regionId,
        totalIncome: item.totalIncome,
        totalExpense: item.totalExpense,
        balance: item.balance,
        transactionCount: item.transactionCount,
      })))
      return new Response(csv, {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="rekap-keuangan-event.csv"',
        },
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat rekap keuangan'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
