import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getSessionFromRequest } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request, AUTH_ROLES.user)

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: session.userId,
      role: session.role,
      fullName: session.fullName ?? null,
      email: session.email ?? null,
      whatsapp: session.whatsapp ?? null,
      institution: null,
      niam: null,
    },
  })
}
