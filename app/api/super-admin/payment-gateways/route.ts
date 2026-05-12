import { NextRequest, NextResponse } from 'next/server'
import {
  getPusatGatewayCredentialSummary,
  listRegionalCredentialStatuses,
  upsertPusatGatewayCredential,
} from '@/lib/server/payment-gateway-credentials'
import { requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(error: unknown) {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : 'Gagal memproses credential payment gateway' },
    { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 400 },
  )
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const [credential, regionalStatuses] = await Promise.all([
      getPusatGatewayCredentialSummary(),
      listRegionalCredentialStatuses(),
    ])
    return NextResponse.json({ ok: true, data: { credential, regionalStatuses } })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const payload = await request.json()
    const result = await upsertPusatGatewayCredential(
      String(payload.apiKey || payload.api_key || ''),
      String(payload.webhookSecret || payload.webhook_secret || ''),
      payload.isActive ?? payload.is_active ?? true,
    )
    const [credential, regionalStatuses] = await Promise.all([
      getPusatGatewayCredentialSummary(),
      listRegionalCredentialStatuses(),
    ])
    return NextResponse.json({ ok: true, data: result, credential, regionalStatuses })
  } catch (error) {
    return jsonError(error)
  }
}
