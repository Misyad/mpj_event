import { NextRequest, NextResponse } from 'next/server'
import { getRegistrationMemberByNiam } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const value = request.nextUrl.searchParams.get('value') ?? ''
    const member = await getRegistrationMemberByNiam(value)

    return NextResponse.json({
      ok: true,
      valid: Boolean(member),
      data: member,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, valid: false, error: error instanceof Error ? error.message : 'Gagal validasi NIAM' },
      { status: 400 },
    )
  }
}
