import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getEventFromDb, getParticipantsByEventFromDb, getPaymentRecordsByEventFromDb, updateEventInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal mengubah event'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') || message.includes('scope') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function scopedUpdate(request: NextRequest, id: string) {
  const session = await requireAdminPermission(request, 'events.update')
  const existing = await getEventFromDb(id)
  if (!existing) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })

  const payload = await request.json()
  const requestedStatus = payload.status ? String(payload.status).toUpperCase() : ''
  if (requestedStatus === 'REJECTED' && !String(payload.approvalReason || payload.reason || '').trim()) {
    throw new Error('Alasan penolakan approval wajib diisi')
  }
  if (session.role === AUTH_ROLES.regionalAdmin && (existing.scope !== 'regional' || existing.regionId !== session.regionalId)) {
    throw new Error('Regional scope tidak valid')
  }

  const eventPayload =
    session.role === AUTH_ROLES.regionalAdmin
      ? {
          ...payload,
          scope: 'regional',
          regionId: requireRegionalScope(session, existing.regionId),
          region_id: requireRegionalScope(session, existing.regionId),
        }
      : payload

  const event = await updateEventInDb(id, eventPayload)
  if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })

  const previousStatus = String(existing.status).toUpperCase()
  const nextStatus = String(event.status).toUpperCase()
  if (previousStatus !== nextStatus && (nextStatus === 'APPROVED' || nextStatus === 'REJECTED')) {
    await recordAdminActivity(request, {
      action: nextStatus === 'APPROVED' ? 'event.approval_approved' : 'event.approval_rejected',
      entityType: 'event',
      entityId: event.id,
      metadata: {
        title: event.title,
        previousStatus,
        nextStatus,
        reason: String(payload.approvalReason || payload.reason || '').trim() || null,
      },
    })
  }
  return NextResponse.json({ ok: true, data: event })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const session = await requireAdminPermission(request, 'events.read')
    const event = await getEventFromDb(id)
    if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })
    if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
      throw new Error('Regional scope tidak valid')
    }

    const [participants, payments] = await Promise.all([
      getParticipantsByEventFromDb(event.id),
      getPaymentRecordsByEventFromDb(event.id),
    ])

    return NextResponse.json({ ok: true, data: event, participants, payments })
  } catch (error) {
    return adminError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    return await scopedUpdate(request, id)
  } catch (error) {
    return adminError(error)
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    return await scopedUpdate(request, id)
  } catch (error) {
    return adminError(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return NextResponse.json({ ok: false, error: `Delete event ${id} belum diaktifkan untuk Event V4` }, { status: 405 })
}
