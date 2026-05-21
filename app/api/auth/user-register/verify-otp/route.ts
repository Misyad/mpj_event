import { NextRequest, NextResponse } from 'next/server'
import {
  checkOtpVerifyRateLimit,
  getClientIp,
  logSecurityEvent,
} from '@/lib/auth/registration-security'
import { verifyPendingRegistration } from '@/lib/server/public-user-registration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SECURITY HARDENED: OTP Verification Endpoint
 * - Verifies OTP code
 * - Creates user account with HARDCODED 'public' role
 * - Issues session tokens
 * - Logs all activity
 */

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request)

  try {
    const rawBody = await request.text()
    const body = rawBody ? JSON.parse(rawBody) : {}

    // SECURITY: Reject any role parameter - this indicates tampering attempt
    if ('role' in body || 'roleId' in body || 'roleName' in body) {
      console.warn(`[SECURITY] Role injection attempt in OTP verification from ${ipAddress}`)
      logSecurityEvent({
        type: 'role_injection_attempt',
        email: body.email,
        ipAddress,
      })
      return NextResponse.json({ ok: false, error: 'Payload format tidak valid' }, { status: 400 })
    }

    const email = String(body.email || '').trim().toLowerCase()
    const otp = String(body.otp || '').trim()
    const next = typeof body.next === 'string' ? body.next : undefined

    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json({ ok: false, error: 'Email dan OTP wajib diisi' }, { status: 400 })
    }

    // Check rate limit
    const rateLimit = checkOtpVerifyRateLimit(email, ipAddress)
    if (!rateLimit.allowed) {
      logSecurityEvent({
        type: 'rate_limit_exceeded',
        email,
        ipAddress,
        details: { action: 'otp_verify', retryAfter: rateLimit.retryAfter },
      })
      return NextResponse.json(
        {
          ok: false,
          error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${rateLimit.retryAfter} detik`,
        },
        { status: 429 },
      )
    }

    const user = await verifyPendingRegistration(email, otp)
    if (!user) {
      logSecurityEvent({
        type: 'otp_verify_failed',
        email,
        ipAddress,
      })
      return NextResponse.json({ ok: false, error: 'Kode OTP tidak valid atau sudah expired' }, { status: 400 })
    }

    logSecurityEvent({
      type: 'otp_verify_success',
      email,
      ipAddress,
    })

    const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? `/auth/user-login?next=${encodeURIComponent(next)}` : '/auth/user-login'

    return NextResponse.json({
      ok: true,
      message: 'Akun berhasil dibuat',
      redirectTo,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verifikasi OTP gagal'
    console.error('[OTP VERIFY ERROR]', error)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
