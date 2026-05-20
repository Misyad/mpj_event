import { NextResponse } from 'next/server'
import { listInstitutionOptions } from '@/lib/server/master-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: await listInstitutionOptions() })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat instansi' },
      { status: 400 },
    )
  }
}
