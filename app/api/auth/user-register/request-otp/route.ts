import { NextRequest, NextResponse } from 'next/server'
import {
  checkOtpRequestRateLimit,
  getClientIp,
  logSecurityEvent,
  validateRegistrationPayload,
} from '@/lib/auth/registration-security'
import { storePendingRegistration } from '@/lib/server/public-user-registration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SECURITY HARDENED: OTP Request Endpoint for Public User Registration
 * - Validates payload strictly
 * - Rejects any role parameter to prevent exploitation
 * - Rate limits by email + IP
 * - Sends OTP via email (TODO)
 * - Logs security events
 */

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request)

  try {
    const rawBody = await request.text()
    const body = rawBody ? JSON.parse(rawBody) : {}

    // SECURITY: Validate payload strictly
    const validation = validateRegistrationPayload(body)
    if (!validation.valid) {
      logSecurityEvent({
        type: 'payload_validation_failed',
        email: body.email,
        ipAddress,
        details: { error: validation.error },
      })
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const payload = validation.payload!
    const email = payload.email

    // Check rate limit
    const rateLimit = checkOtpRequestRateLimit(email, ipAddress)
    if (!rateLimit.allowed) {
      logSecurityEvent({
        type: 'rate_limit_exceeded',
        email,
        ipAddress,
        details: { retryAfter: rateLimit.retryAfter },
      })
      return NextResponse.json(
        {
          ok: false,
          error: `Terlalu banyak permintaan. Silakan coba lagi dalam ${rateLimit.retryAfter} detik`,
        },
        { status: 429 },
      )
    }

    const otpData = await storePendingRegistration(payload)

    logSecurityEvent({
      type: 'otp_request',
      email,
      ipAddress,
    })

    // In development, return code. In production, don't expose this
    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      ok: true,
      message: 'OTP telah dikirim ke email Anda',
      canResendAt: new Date(otpData.canResendAt).toISOString(),
      // SECURITY: Only in development
      ...(isDev && { _dev_otp: otpData.code }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Permintaan OTP gagal'
    console.error('[OTP REQUEST ERROR]', error)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
