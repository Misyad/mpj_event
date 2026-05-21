import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, logSecurityEvent, validateRegistrationPayload } from '@/lib/auth/registration-security'
import { createPublicUserAccount } from '@/lib/server/public-user-registration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request)

  try {
    const rawBody = await request.text()
    const body = rawBody ? JSON.parse(rawBody) : {}
    const validation = validateRegistrationPayload(body)

    if (!validation.valid) {
      logSecurityEvent({
        type: 'payload_validation_failed',
        email: typeof body.email === 'string' ? body.email : undefined,
        ipAddress,
        details: { error: validation.error },
      })
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const user = await createPublicUserAccount(validation.payload!)

    return NextResponse.json({
      ok: true,
      message: 'Akun berhasil dibuat, silakan login.',
      redirectTo: '/auth/user-login',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registrasi akun gagal'
    console.error('[USER REGISTER ERROR]', error)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
