import { NextRequest, NextResponse } from 'next/server'
import { clearRoleSessionCookies, setRoleSessionCookies } from '@/lib/auth/session-cookies'
import { refreshAdminSession } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const refreshed = await refreshAdminSession(request)
    const response = NextResponse.json({ ok: true, role: refreshed.role, user: refreshed.user })
    setRoleSessionCookies(response, {
      role: refreshed.role,
      accessToken: refreshed.accessToken,
      maxAge: refreshed.maxAge,
    })
    return response
  } catch (error) {
    const response = NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Refresh token tidak valid' },
      { status: 401 },
    )
    clearRoleSessionCookies(response)
    return response
  }
}
