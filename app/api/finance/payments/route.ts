import { NextRequest, NextResponse } from 'next/server'
import { requireAdminPermission } from '@/lib/server/rbac'
import { listPaymentMonitoring, toCsv } from '@/lib/server/finance'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memuat monitoring payment'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const params = request.nextUrl.searchParams
    const data = await listPaymentMonitoring(session, {
      eventId: params.get('eventId') || undefined,
      status: params.get('status') || undefined,
      dateStart: params.get('dateStart') || undefined,
      dateEnd: params.get('dateEnd') || undefined,
    })

    if (params.get('export') === 'csv') {
      const csv = toCsv(data.map((item) => ({
        paymentId: item.paymentId,
        event: item.eventTitle,
        participant: item.participantName,
        path: item.path,
        amount: item.amount,
        status: item.status,
        method: item.paymentMethod,
        channel: item.paymentChannel,
        paymentDate: item.paymentDate,
      })))
      return new Response(csv, {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="monitoring-payment.csv"',
        },
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return jsonError(error)
  }
}
