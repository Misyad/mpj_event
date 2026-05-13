import { NextRequest, NextResponse } from 'next/server'
import { createSpeakerInDb, getSpeakersFromDb } from '@/lib/server/speakers'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unauthorized'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission(request, 'events.read')
    const data = await getSpeakersFromDb()
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return adminError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission(request, 'events.create')
    const data = await createSpeakerInDb(await request.json())
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return adminError(error)
  }
}
