import { NextRequest, NextResponse } from 'next/server'
import { listPublicUserAccounts, requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)

    const searchParams = request.nextUrl.searchParams
    const data = await listPublicUserAccounts({
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    })

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil akun pengguna'
    const status = message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
