import { NextRequest, NextResponse } from 'next/server'
import {
  checkOtpRequestRateLimit,
  getClientIp,
  logSecurityEvent,
  sanitizeEmailForLog,
  validateRegistrationPayload,
} from '@/lib/auth/registration-security'

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

const OTP_VALID_MINUTES = process.env.OTP_VALID_MINUTES ? Number(process.env.OTP_VALID_MINUTES) : 10
const OTP_RESEND_COOLDOWN_SECONDS = 30

// In-memory OTP store (production: use Redis)
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number; lastSentAt: number }>()

function generateOtpCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, '0')
}

function storeOtp(email: string): { code: string; expiresAt: number; canResendAt: number } {
  // Clean expired entries
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < Date.now()) {
      otpStore.delete(key)
    }
  }

  const existing = otpStore.get(email)
  const now = Date.now()
  const lastSentAt = existing?.lastSentAt || 0
  const timeSinceLastSend = (now - lastSentAt) / 1000

  // Enforce cooldown
  if (existing && timeSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
    throw new Error(`Silakan tunggu ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - timeSinceLastSend)} detik sebelum meminta ulang`)
  }

  const code = generateOtpCode()
  const expiresAt = now + OTP_VALID_MINUTES * 60 * 1000
  const canResendAt = now + OTP_RESEND_COOLDOWN_SECONDS * 1000

  otpStore.set(email, { code, expiresAt, attempts: 0, lastSentAt: now })

  // TODO: Send OTP via email service (SendGrid, Resend, etc)
  console.log(`[OTP GENERATED] ${sanitizeEmailForLog(email)} | Code: ${code} | Valid: ${OTP_VALID_MINUTES} min`)

  return { code, expiresAt, canResendAt }
}

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

    // TODO: Check if email already registered in database

    // Generate and store OTP
    const otpData = storeOtp(email)

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
