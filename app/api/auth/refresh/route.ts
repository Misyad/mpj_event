import { NextRequest, NextResponse } from 'next/server'
import { getAuthRoleConfig } from '@/lib/auth/roles'
import { refreshAdminSession } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const refreshed = await refreshAdminSession(request)
    const config = getAuthRoleConfig(refreshed.role)
    if (!config) throw new Error('Role tidak valid')

    const response = NextResponse.json({ ok: true, role: refreshed.role, user: refreshed.user })
    response.cookies.set(config.cookieName, refreshed.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: refreshed.maxAge,
    })
    response.cookies.set('mpj_active_role', refreshed.role, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: refreshed.maxAge,
    })
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Refresh token tidak valid' },
      { status: 401 },
    )
  }
}
