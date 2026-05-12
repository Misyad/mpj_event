import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import {
  getGatewayCredentialSummaryForRegional,
  upsertRegionalGatewayCredential,
} from '@/lib/server/payment-gateway-credentials'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses credential payment gateway regional'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function requireRegionalPaymentSession(request: NextRequest) {
  const session = await requireAdminPermission(request, 'events.create')
  if (session.role !== AUTH_ROLES.regionalAdmin) throw new Error('Forbidden')
  if (!session.regionalId) throw new Error('Admin Regional tidak memiliki regional_id')
  return { ...session, regionalId: session.regionalId }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRegionalPaymentSession(request)
    const credential = await getGatewayCredentialSummaryForRegional(session.regionalId)
    return NextResponse.json({ ok: true, data: credential })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRegionalPaymentSession(request)
    const payload = await request.json()
    const result = await upsertRegionalGatewayCredential(
      session.regionalId,
      String(payload.apiKey || payload.api_key || ''),
      String(payload.webhookSecret || payload.webhook_secret || ''),
      payload.isActive ?? payload.is_active ?? true,
    )
    const credential = await getGatewayCredentialSummaryForRegional(session.regionalId)
    return NextResponse.json({ ok: true, data: result, credential })
  } catch (error) {
    return jsonError(error)
  }
}
