import { NextRequest, NextResponse } from 'next/server'
import { createAdminParticipantInDb } from '@/lib/server/events'
import { recordAdminActivity, requireAdminPermission, requireRegionalScope } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ImportRow = Record<string, unknown>

function getValue(row: ImportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && String(value).trim()) return String(value).trim()
  }
  return ''
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'participants.create')
    const regionalId = requireRegionalScope(session, null)
    const payload = await request.json()
    const eventId = String(payload.event_id || payload.eventId || '')
    const rows = Array.isArray(payload.rows) ? payload.rows as ImportRow[] : []
    if (!eventId) throw new Error('Event wajib dipilih')
    if (rows.length === 0) throw new Error('Data CSV kosong')

    const results: Array<{ row: number; ok: boolean; id?: string; error?: string }> = []
    for (const [index, row] of rows.entries()) {
      try {
        const result = await createAdminParticipantInDb(eventId, {
          registration_path: getValue(row, ['registration_path', 'jalur']) === 'NIAM' ? 'NIAM' : 'UMUM',
          full_name: getValue(row, ['full_name', 'nama', 'name']),
          institution_name: getValue(row, ['institution_name', 'instansi', 'unit']),
          whatsapp: getValue(row, ['whatsapp', 'wa', 'phone']),
          email: getValue(row, ['email']),
          niam: getValue(row, ['niam']),
          class_id: getValue(row, ['class_id', 'kelas_id']),
        }, { scope: 'regional', regionId: regionalId, userId: session.userId })
        results.push({ row: index + 1, ok: true, id: result.participant.id })
      } catch (error) {
        results.push({ row: index + 1, ok: false, error: error instanceof Error ? error.message : 'Gagal import baris' })
      }
    }

    await recordAdminActivity(request, {
      action: 'regional_participant.imported',
      entityType: 'event',
      entityId: eventId,
      metadata: { regionalId, totalRows: rows.length, successRows: results.filter((item) => item.ok).length },
    })
    return NextResponse.json({ ok: true, data: results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal import peserta'
    return NextResponse.json({ ok: false, error: message }, { status: message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400 })
  }
}
