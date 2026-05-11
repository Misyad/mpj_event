import { NextResponse } from 'next/server'
import { getEventFromDb } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const event = await getEventFromDb(id)

    if (!event) {
      return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: event })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load event',
      },
      { status: 500 },
    )
  }
}
