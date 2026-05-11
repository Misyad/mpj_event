import { NextRequest, NextResponse } from 'next/server'
import { createEventInDb, getEventsFromDb } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const events = await getEventsFromDb()
    return NextResponse.json({ ok: true, data: events })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data event',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const event = await createEventInDb(await request.json())
    return NextResponse.json({ ok: true, data: event }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Gagal membuat event',
      },
      { status: 400 },
    )
  }
}
