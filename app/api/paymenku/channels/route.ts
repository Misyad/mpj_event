import { NextResponse } from 'next/server'
import { getPaymenkuChannels } from '@/lib/server/paymenku'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const channels = await getPaymenkuChannels()
    return NextResponse.json({ ok: true, data: channels })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal mengambil channel Paymenku' },
      { status: 400 },
    )
  }
}
