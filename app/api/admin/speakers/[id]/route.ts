import { NextRequest, NextResponse } from 'next/server'
import { deleteSpeakerFromDb, getSpeakerFromDb, updateSpeakerInDb } from '@/lib/server/speakers'
import { recordAdminActivity, requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal memproses narasumber'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    await requireAdminPermission(request, 'events.read')
    const data = await getSpeakerFromDb(id)
    if (!data) return NextResponse.json({ ok: false, error: 'Narasumber tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return adminError(error)
  }
}

async function updateSpeaker(request: NextRequest, id: string) {
  await requireAdminPermission(request, 'events.update')
  const data = await updateSpeakerInDb(id, await request.json())
  if (!data) return NextResponse.json({ ok: false, error: 'Narasumber tidak ditemukan' }, { status: 404 })
  await recordAdminActivity(request, {
    action: 'speaker.updated',
    entityType: 'speaker',
    entityId: data.id,
    metadata: { name: data.nama_lengkap, category: data.kategori },
  })
  return NextResponse.json({ ok: true, data })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    return await updateSpeaker(request, id)
  } catch (error) {
    return adminError(error)
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    return await updateSpeaker(request, id)
  } catch (error) {
    return adminError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    await requireAdminPermission(request, 'events.update')
    const deleted = await deleteSpeakerFromDb(id)
    if (!deleted) return NextResponse.json({ ok: false, error: 'Narasumber tidak ditemukan' }, { status: 404 })
    await recordAdminActivity(request, {
      action: 'speaker.deleted',
      entityType: 'speaker',
      entityId: id,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return adminError(error)
  }
}
