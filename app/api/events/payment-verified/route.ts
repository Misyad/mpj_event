import { NextRequest, NextResponse } from 'next/server'
import { confirmParticipantFromPayment } from '@/lib/server/events'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAdminPermission(request, 'participants.verify')
    const participant = await confirmParticipantFromPayment(await request.json())
    return NextResponse.json({ ok: true, data: participant })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal memproses payment verified' },
      { status: 400 },
    )
  }
}
