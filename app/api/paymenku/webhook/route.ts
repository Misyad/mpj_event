import { NextRequest, NextResponse } from 'next/server'
import { applyPaymenkuPaymentUpdate } from '@/lib/server/events'
import { verifyPaymenkuSignature, type PaymenkuWebhookPayload } from '@/lib/server/paymenku'
import { getGatewayCredentialForPayment } from '@/lib/server/payment-gateway-credentials'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-paymenku-signature')
  const timestamp = request.headers.get('x-paymenku-timestamp')

  try {
    const payload = JSON.parse(rawBody) as PaymenkuWebhookPayload
    const credential = await getGatewayCredentialForPayment({
      paymentId: payload.reference_id,
      externalRef: payload.trx_id,
    })

    if (!verifyPaymenkuSignature(rawBody, signature, timestamp, credential)) {
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }

    const participant = await applyPaymenkuPaymentUpdate(payload)
    return NextResponse.json({ ok: true, data: participant })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal memproses webhook Paymenku' },
      { status: 400 },
    )
  }
}
