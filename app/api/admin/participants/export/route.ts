import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getAdminParticipantsFromDb } from '@/lib/server/events'
import { requireAdminPermission } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.read')
    const participants = await getAdminParticipantsFromDb(
      session.role === AUTH_ROLES.regionalAdmin
        ? { scope: 'regional', regionId: session.regionalId }
        : {},
    )
    const rows = participants.map((participant) => [
      participant.id,
      participant.event?.title ?? participant.event_id,
      participant.registration_path,
      participant.fullName ?? participant.full_name ?? '',
      participant.institution ?? participant.institution_name ?? '',
      participant.whatsapp ?? '',
      participant.email ?? '',
      participant.payment_status,
      participant.attendance_status,
      participant.ticketCode ?? participant.qr_token,
    ])
    const csv = [
      ['ID', 'Event', 'Jalur', 'Nama', 'Instansi', 'WhatsApp', 'Email', 'Status Bayar', 'Kehadiran', 'Kode Tiket'],
      ...rows,
    ].map((row) => row.map(csvCell).join(',')).join('\n')

    return new NextResponse(csv, {
      headers: {
        'content-disposition': 'attachment; filename="master-peserta.csv"',
        'content-type': 'text/csv; charset=utf-8',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal export peserta'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
