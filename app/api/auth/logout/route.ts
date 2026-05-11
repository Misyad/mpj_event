import { NextResponse } from 'next/server'
import { AUTH_ROLE_CONFIGS } from '@/lib/auth/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  for (const role of AUTH_ROLE_CONFIGS) {
    response.cookies.delete(role.cookieName)
  }
  response.cookies.delete('mpj_active_role')

  return response
}
