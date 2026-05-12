import { NextRequest, NextResponse } from 'next/server'
import { listGatewayCredentials, upsertGatewayCredential } from '@/lib/server/payment-gateway-credentials'
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
    const credentials = await listGatewayCredentials()
    return NextResponse.json({ ok: true, data: credentials })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const payload = await request.json()
    const result = await upsertGatewayCredential({
      ownerType: payload.ownerType || payload.owner_type,
      regionalId: payload.regionalId || payload.regional_id || null,
      apiKey: String(payload.apiKey || payload.api_key || ''),
      webhookSecret: String(payload.webhookSecret || payload.webhook_secret || ''),
      isActive: payload.isActive ?? payload.is_active ?? true,
    })
    const credentials = await listGatewayCredentials()
    return NextResponse.json({ ok: true, data: result, credentials })
  } catch (error) {
    return jsonError(error)
  }
}
