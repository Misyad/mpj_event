import { NextResponse } from 'next/server'
import { applyPaymenkuPaymentUpdate } from '@/lib/server/events'
import { checkPaymenkuStatus } from '@/lib/server/paymenku'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(_request: Request, context: RouteContext<'/api/paymenku/status/[id]'>) {
  try {
    const { id } = await context.params
    const status = await checkPaymenkuStatus(id)
    const participant = await applyPaymenkuPaymentUpdate(status)
    return NextResponse.json({ ok: true, data: participant, status })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal refresh status Paymenku' },
      { status: 400 },
    )
  }
}
