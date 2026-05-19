import type { NextRequest } from 'next/server'

const buckets = new Map<string, { count: number; resetAt: number }>()

export function assertRateLimit(request: NextRequest, scope: string, limit = 60, windowMs = 60_000) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwardedFor || request.headers.get('x-real-ip') || 'local'
  assertRateLimitKey(`${scope}:${ip}`, limit, windowMs)
}

export function assertRateLimitKey(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  bucket.count += 1
  if (bucket.count > limit) {
    throw new Error('Terlalu banyak request verifikasi. Coba lagi nanti.')
  }
}
