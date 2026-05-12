import { NextRequest, NextResponse } from 'next/server'
import type { AuthRole } from '@/lib/auth/roles'
import { getAuthRoleConfig } from '@/lib/auth/roles'
import { getSafeRedirectPath } from '@/lib/auth/role-config'
import { setRoleSessionCookies } from '@/lib/auth/session-cookies'
import { loginAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const role = typeof payload.role === 'string' ? (payload.role as AuthRole) : undefined
    const email = typeof payload.email === 'string' ? payload.email.trim() : ''
    const password = typeof payload.password === 'string' ? payload.password : ''
    const remember = Boolean(payload.remember)
    const config = role ? getAuthRoleConfig(role) : null

    if (role && !config) {
      return NextResponse.json({ ok: false, error: 'Role login tidak valid' }, { status: 400 })
    }

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    const login = await loginAdmin(request, {
      role,
      email,
      password,
      remember,
    })

    if (login.requiresRoleSelection) {
      return NextResponse.json({
        ok: true,
        requiresRoleSelection: true,
        roles: login.roles,
        user: login.user,
      })
    }

    const redirectTo = getSafeRedirectPath(typeof payload.next === 'string' ? payload.next : null, login.role)
    const response = NextResponse.json({ ok: true, role: login.role, redirectTo })

    setRoleSessionCookies(response, {
      role: login.role,
      accessToken: login.accessToken,
      refreshToken: login.refreshToken,
      maxAge: login.maxAge,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Payload login tidak valid' },
      { status: 400 },
    )
  }
}
