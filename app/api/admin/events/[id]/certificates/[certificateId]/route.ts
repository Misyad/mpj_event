import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getEventFromDb, updateCertificateLifecycle } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'
import type { CertificateStatus } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string; certificateId: string }>
}

function lifecycleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal mengubah status sertifikat'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id, certificateId } = await context.params

  try {
    const session = await requireAdminPermission(request, 'events.update')
    const event = await getEventFromDb(id)
    if (!event) throw new Error('Event tidak ditemukan')
    if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
      throw new Error('Regional scope tidak valid')
    }
    const payload = await request.json()
    const status = String(payload.status || 'revoked') as CertificateStatus
    if (!['active', 'revoked', 'expired', 'reissued'].includes(status)) throw new Error('Status sertifikat tidak valid')
    const certificate = await updateCertificateLifecycle(certificateId, status, payload.reason, event.id)
    await recordAdminActivity(request, {
      action: `event_certificate.${status}`,
      entityType: 'event_certificate',
      entityId: certificate.id,
      metadata: { eventId: event.id, certificateNumber: certificate.certificateNumber, reason: payload.reason ?? null },
    })
    return NextResponse.json({ ok: true, data: certificate })
  } catch (error) {
    return lifecycleError(error)
  }
}
