import { NextResponse } from 'next/server'
import { seedTestPublicUser } from '@/lib/server/public-user-registration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  try {
    const user = await seedTestPublicUser()
    return NextResponse.json({
      ok: true,
      data: {
        user,
        email: 'test@mpjevent.com',
        password: '12345678',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Seed test user gagal'
    const status = message.includes('sudah terdaftar') ? 409 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
