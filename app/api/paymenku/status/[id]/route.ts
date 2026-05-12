import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { applyPaymenkuPaymentUpdate } from '@/lib/server/events'
import { checkPaymenkuStatus } from '@/lib/server/paymenku'
import { getGatewayCredentialForPayment } from '@/lib/server/payment-gateway-credentials'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, context: RouteContext<'/api/paymenku/status/[id]'>) {
  try {
    await requireAdminPermission(request, 'participants.verify')
    const { id } = await context.params
    const credential = await getGatewayCredentialForPayment({ paymentId: id, externalRef: id })
    const status = await checkPaymenkuStatus(id, credential)
    const participant = await applyPaymenkuPaymentUpdate(status)
    return NextResponse.json({ ok: true, data: participant, status })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal refresh status Paymenku' },
      { status: 400 },
    )
  }
}
