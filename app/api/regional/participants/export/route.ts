import { NextRequest, NextResponse } from 'next/server'
import { getAdminParticipantsFromDb } from '@/lib/server/events'
import { requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.read')
    const regionalId = requireRegionalScope(session, null)
    const participants = await getAdminParticipantsFromDb({ scope: 'regional', regionId: regionalId })
    const headers = ['Nama', 'Event', 'Jalur', 'Instansi', 'WhatsApp', 'Email', 'Payment Status', 'Attendance Status', 'Nominal', 'Ticket']
    const rows = participants.map((participant) => [
      participant.fullName ?? participant.full_name ?? participant.crew?.full_name ?? participant.guest?.full_name ?? '',
      participant.event?.title ?? '',
      participant.registration_path,
      participant.institution ?? participant.institution_name ?? participant.crew?.unit ?? participant.guest?.institution_name ?? '',
      participant.whatsapp ?? participant.guest?.whatsapp ?? '',
      participant.email ?? '',
      participant.payment_status,
      participant.attendance_status,
      participant.unique_amount ?? 0,
      participant.ticketCode ?? participant.qr_token,
    ])
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="peserta-regional.csv"',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal export peserta'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : 403 })
  }
}
