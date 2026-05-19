import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getPublicUserProfile, getSessionFromRequest, updatePublicUserProfile } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request, AUTH_ROLES.user)

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getPublicUserProfile(session.userId)
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Profil user tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    data: { ...profile, role: session.role },
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await updatePublicUserProfile(request, await request.json())
    return NextResponse.json({ ok: true, data: profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan profil'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
