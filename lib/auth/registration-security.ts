/**
 * SECURITY: Registration Endpoint Security Utilities
 * - Rate limiting for OTP requests
 * - Payload validation with role injection prevention
 * - Logging for security audits
 */

import type { NextRequest } from 'next/server'

interface RateLimitData {
  count: number
  expiresAt: number
}

// Rate limit store (production: use Redis)
const rateLimitStore = new Map<string, RateLimitData>()

const MAX_OTP_REQUESTS_PER_HOUR = 5
const MAX_VERIFY_ATTEMPTS_PER_HOUR = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Clean expired rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.expiresAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get client IP for rate limiting
 */
export function getClientIp(request: NextRequest): string {
  return request.ip || request.headers.get('x-forwarded-for') || 'unknown'
}

/**
 * Check rate limit for OTP requests
 */
export function checkOtpRequestRateLimit(email: string, ipAddress: string): { allowed: boolean; retryAfter?: number } {
  cleanupRateLimits()
  const now = Date.now()
  
  // Rate limit key: email + IP to prevent targeting specific emails
  const key = `otp_req:${email}:${ipAddress}`
  const data = rateLimitStore.get(key)

  if (!data || data.expiresAt < now) {
    // First request or expired - allow
    rateLimitStore.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (data.count >= MAX_OTP_REQUESTS_PER_HOUR) {
    const retryAfter = Math.ceil((data.expiresAt - now) / 1000)
    console.warn(`[RATE LIMIT] OTP request exceeded for ${email} from ${ipAddress}`)
    return { allowed: false, retryAfter }
  }

  data.count++
  return { allowed: true }
}

/**
 * Check rate limit for OTP verification attempts
 */
export function checkOtpVerifyRateLimit(email: string, ipAddress: string): { allowed: boolean; retryAfter?: number } {
  cleanupRateLimits()
  const now = Date.now()
  
  const key = `otp_verify:${email}:${ipAddress}`
  const data = rateLimitStore.get(key)

  if (!data || data.expiresAt < now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (data.count >= MAX_VERIFY_ATTEMPTS_PER_HOUR) {
    const retryAfter = Math.ceil((data.expiresAt - now) / 1000)
    console.warn(`[RATE LIMIT] OTP verification attempts exceeded for ${email} from ${ipAddress}`)
    return { allowed: false, retryAfter }
  }

  data.count++
  return { allowed: true }
}

/**
 * Validate registration payload - STRICT validation to prevent exploitation
 */
export interface RegistrationPayload {
  fullName: string
  email: string
  password: string
  whatsapp?: string
}

export function validateRegistrationPayload(body: unknown): { valid: boolean; payload?: RegistrationPayload; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Payload wajib berupa JSON' }
  }

  const obj = body as Record<string, unknown>

  // CRITICAL SECURITY: Reject if role is present - this indicates tampering or exploitation attempt
  if ('role' in obj || 'roleId' in obj || 'roleName' in obj) {
    console.warn('[SECURITY] Role parameter injection attempt detected in registration payload')
    return { valid: false, error: 'Payload format tidak valid' }
  }

  // CRITICAL: Only allow these exact fields
  const allowedKeys = new Set(['fullName', 'email', 'password', 'whatsapp', 'next'])
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.has(key)) {
      console.warn(`[SECURITY] Unknown field '${key}' in registration payload`)
      return { valid: false, error: 'Payload format tidak valid' }
    }
  }

  const fullName = String(obj.fullName || '').trim()
  const email = String(obj.email || '').trim().toLowerCase()
  const password = String(obj.password || '').trim()
  const whatsapp = obj.whatsapp ? String(obj.whatsapp).trim() : undefined

  // Validation
  if (!fullName || fullName.length < 3) {
    return { valid: false, error: 'Nama lengkap minimal 3 karakter' }
  }

  if (fullName.length > 255) {
    return { valid: false, error: 'Nama lengkap terlalu panjang' }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Format email tidak valid' }
  }

  if (!password || password.length < 8) {
    return { valid: false, error: 'Password minimal 8 karakter' }
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password terlalu panjang' }
  }

  if (whatsapp && !/^[0-9+\-\s()]{10,20}$/.test(whatsapp)) {
    return { valid: false, error: 'Format WhatsApp tidak valid' }
  }

  return {
    valid: true,
    payload: { fullName, email, password, whatsapp },
  }
}

/**
 * Log security events
 */
export function logSecurityEvent(event: {
  type: 'otp_request' | 'otp_verify_success' | 'otp_verify_failed' | 'rate_limit_exceeded' | 'role_injection_attempt' | 'payload_validation_failed'
  email?: string
  ipAddress: string
  details?: Record<string, unknown>
}) {
  const timestamp = new Date().toISOString()
  const message = `[SECURITY] ${event.type.toUpperCase()} | Email: ${event.email || 'N/A'} | IP: ${event.ipAddress} | ${JSON.stringify(event.details || {})}`
  console.log(`${timestamp} ${message}`)
}

/**
 * Sanitize email for logging (prevent email harvesting from logs)
 */
export function sanitizeEmailForLog(email: string): string {
  const [localPart, domain] = email.split('@')
  const masked = localPart.slice(0, 2) + '*'.repeat(Math.max(0, localPart.length - 4)) + localPart.slice(-2)
  return `${masked}@${domain}`
}
