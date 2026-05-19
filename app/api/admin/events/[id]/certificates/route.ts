import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { generateEventCertificates, getEventCertificateSummary, getEventFromDb, updateEventCertificateSettings } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'
import { normalizeCertificateLayout } from '@/components/certificates/certificate-template-layout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function certificateError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses sertifikat event'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function assertEventScope(request: NextRequest, eventId: string, permission: 'events.read' | 'events.update') {
  const session = await requireAdminPermission(request, permission)
  const event = await getEventFromDb(eventId)
  if (!event) throw new Error('Event tidak ditemukan')
  if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
    throw new Error('Regional scope tidak valid')
  }
  return { session, event }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const { event } = await assertEventScope(request, id, 'events.read')
    const summary = await getEventCertificateSummary(event.id)
    return NextResponse.json({ ok: true, data: summary })
  } catch (error) {
    return certificateError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const { session, event } = await assertEventScope(request, id, 'events.update')
    const payload = await request.json()
    const summary = await updateEventCertificateSettings(event.id, {
      enabled: payload.enabled,
      templateUrl: payload.templateUrl ?? payload.template_url,
      templateName: payload.templateName ?? payload.template_name,
      layout: normalizeCertificateLayout(payload.layout),
      saveReusable: Boolean(payload.saveReusable),
      actorId: session.userId,
    })
    await recordAdminActivity(request, {
      action: 'event_certificate.settings_updated',
      entityType: 'event',
      entityId: event.id,
      metadata: {
        title: event.title,
        enabled: summary.settings.enabled,
        templateName: summary.settings.templateName,
      },
    })
    return NextResponse.json({ ok: true, data: summary })
  } catch (error) {
    return certificateError(error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const { session, event } = await assertEventScope(request, id, 'events.update')
    const summary = await generateEventCertificates(event.id, session.userId)
    await recordAdminActivity(request, {
      action: 'event_certificate.generated',
      entityType: 'event',
      entityId: event.id,
      metadata: {
        title: event.title,
        created: summary.created,
        generatedCount: summary.settings.generatedCount,
      },
    })
    return NextResponse.json({ ok: true, data: summary })
  } catch (error) {
    return certificateError(error)
  }
}
