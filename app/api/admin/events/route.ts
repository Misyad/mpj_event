import { NextRequest, NextResponse } from 'next/server'
import { EVENT_API_BASE_URL } from '@/lib/event-api'
import { getEventsFromDb } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getAdminToken() {
  return process.env.ADMIN_API_TOKEN || 'mpj-event-admin-token'
}

async function forward(path: string, init: RequestInit = {}) {
  const response = await fetch(`${EVENT_API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': getAdminToken(),
    },
  })
  const payload = await response.json()

  return NextResponse.json(payload, { status: response.status })
}

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
  return forward('/events', {
    method: 'POST',
    body: JSON.stringify(await request.json()),
  })
}
