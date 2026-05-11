import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLE_CONFIGS } from '@/lib/auth/roles'
import { revokeCurrentSession } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  await revokeCurrentSession(request)
  const response = NextResponse.json({ ok: true })

  for (const role of AUTH_ROLE_CONFIGS) {
    response.cookies.delete(role.cookieName)
    response.cookies.delete(`${role.cookieName}_refresh`)
  }
  response.cookies.delete('mpj_active_role')

  return response
}
