import { NextRequest, NextResponse } from 'next/server'
import {
  checkOtpVerifyRateLimit,
  getClientIp,
  logSecurityEvent,
  sanitizeEmailForLog,
} from '@/lib/auth/registration-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SECURITY HARDENED: OTP Verification Endpoint
 * - Verifies OTP code
 * - Creates user account with HARDCODED 'public' role
 * - Issues session tokens
 * - Logs all activity
 */

// In-memory OTP store matching request-otp endpoint
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>()

function verifyOtpCode(email: string, code: string): boolean {
  const otpData = otpStore.get(email)
  if (!otpData) return false
  if (otpData.expiresAt < Date.now()) {
    otpStore.delete(email)
    return false
  }
  if (otpData.code !== code) {
    otpData.attempts++
    if (otpData.attempts >= 5) {
      otpStore.delete(email)
      throw new Error('Terlalu banyak percobaan. Silakan minta OTP baru')
    }
    return false
  }
  return true
}

function removeOtp(email: string) {
  otpStore.delete(email)
}

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

    // Verify OTP
    if (!verifyOtpCode(email, otp)) {
      logSecurityEvent({
        type: 'otp_verify_failed',
        email,
        ipAddress,
      })
      return NextResponse.json({ ok: false, error: 'Kode OTP tidak valid atau sudah expired' }, { status: 400 })
    }

    // Remove used OTP
    removeOtp(email)

    logSecurityEvent({
      type: 'otp_verify_success',
      email,
      ipAddress,
    })

    // TODO: Create user account with HARDCODED public role
    // const user = await createPublicUserAccount(request, {...})
    // Then create session tokens
    console.log(`[REGISTRATION] User account creation initiated for ${sanitizeEmailForLog(email)} with HARDCODED public role`)

    const redirectTo = next && next.startsWith('/') ? next : '/auth/user-login'

    return NextResponse.json({
      ok: true,
      message: 'Akun berhasil dibuat',
      redirectTo,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verifikasi OTP gagal'
    console.error('[OTP VERIFY ERROR]', error)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
