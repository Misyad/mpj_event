import { NextResponse } from 'next/server'
import { getUsersDebugSnapshot } from '@/lib/server/public-user-registration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  try {
    const data = await getUsersDebugSnapshot()
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Debug users gagal'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
