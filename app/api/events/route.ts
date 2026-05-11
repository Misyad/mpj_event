import { NextResponse } from 'next/server'
import { getEventsFromDb } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const events = await getEventsFromDb({ publicOnly: true })
    return NextResponse.json({ ok: true, data: events })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load events',
      },
      { status: 500 },
    )
  }
}
