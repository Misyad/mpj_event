import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getAdminParticipantsFromDb } from '@/lib/server/events'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.read')
    const participants = await getAdminParticipantsFromDb(
      session.role === AUTH_ROLES.regionalAdmin
        ? { scope: 'regional', regionId: session.regionalId }
        : {},
    )

    return NextResponse.json({ ok: true, data: participants })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat peserta'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
