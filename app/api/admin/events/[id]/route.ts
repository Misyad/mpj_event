import { NextRequest, NextResponse } from 'next/server'
import { EVENT_API_BASE_URL } from '@/lib/event-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getAdminToken() {
  return process.env.ADMIN_API_TOKEN || 'mpj-event-admin-token'
}

async function forward(id: string, init: RequestInit = {}) {
  const response = await fetch(`${EVENT_API_BASE_URL}/events/${encodeURIComponent(id)}`, {
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return forward(id, {
    method: 'PATCH',
    body: JSON.stringify(await request.json()),
  })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return forward(id, {
    method: 'PUT',
    body: JSON.stringify(await request.json()),
  })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return forward(id, { method: 'DELETE' })
}
