import { NextRequest, NextResponse } from 'next/server'
import { updateEventInDb } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const event = await updateEventInDb(id, await request.json())
    if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ ok: true, data: event })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengubah event' },
      { status: 400 },
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const event = await updateEventInDb(id, await request.json())
    if (!event) return NextResponse.json({ ok: false, error: 'Event tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ ok: true, data: event })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengubah event' },
      { status: 400 },
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return NextResponse.json({ ok: false, error: `Delete event ${id} belum diaktifkan untuk Event V4` }, { status: 405 })
}
