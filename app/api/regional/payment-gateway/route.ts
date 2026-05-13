import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function regionalGatewayDisabled() {
  return NextResponse.json({ ok: false, error: 'Payment Gateway hanya dapat dikelola Admin Pusat pada MVP' }, { status: 403 })
}

export const GET = regionalGatewayDisabled
export const POST = regionalGatewayDisabled
