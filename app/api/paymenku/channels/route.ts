import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getPaymenkuChannels } from '@/lib/server/paymenku'
import { getGatewayCredentialForOwner } from '@/lib/server/payment-gateway-credentials'
import { requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.create')
    const regionalId =
      session.role === AUTH_ROLES.regionalAdmin
        ? requireRegionalScope(session, request.nextUrl.searchParams.get('regionalId'))
        : null
    const credential = await getGatewayCredentialForOwner(session.role === AUTH_ROLES.regionalAdmin ? 'regional' : 'pusat', regionalId)
    const channels = await getPaymenkuChannels(credential)
    return NextResponse.json({ ok: true, data: channels })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengambil channel Paymenku' },
      { status: 400 },
    )
  }
}
