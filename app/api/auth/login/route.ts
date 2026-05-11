import { NextRequest, NextResponse } from 'next/server'
import type { AuthRole } from '@/lib/auth/roles'
import { getAuthRoleConfig } from '@/lib/auth/roles'
import { encodeAuthSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const role = payload.role as AuthRole
    const email = typeof payload.email === 'string' ? payload.email.trim() : ''
    const password = typeof payload.password === 'string' ? payload.password : ''
    const remember = Boolean(payload.remember)
    const config = getAuthRoleConfig(role)

    if (!config) {
      return NextResponse.json({ ok: false, error: 'Role login tidak valid' }, { status: 400 })
    }

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    const token = encodeAuthSession({
      role,
      email,
      remember,
      issuedAt: new Date().toISOString(),
    })
    const response = NextResponse.json({ ok: true, role, redirectTo: config.dashboardPath })

    response.cookies.set(config.cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
    })
    response.cookies.set('mpj_active_role', role, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
    })

    return response
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload login tidak valid' }, { status: 400 })
  }
}
