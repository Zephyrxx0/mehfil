import { NextResponse } from 'next/server'

interface RateLimitRecord {
  timestamps: number[]
}

// In-memory sliding window cache
const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up stale IP records every 5 minutes to prevent memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 300_000)
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key)
      }
    }
  }, 300_000).unref?.()
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Checks a sliding-window rate limit for a given key (e.g. client IP + route).
 */
export function checkRateLimit(key: string, limit = 15, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  let record = rateLimitMap.get(key)

  if (!record) {
    record = { timestamps: [] }
    rateLimitMap.set(key, record)
  }

  // Filter timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs)

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0]
    const resetTime = oldest + windowMs
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime,
    }
  }

  record.timestamps.push(now)
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetTime: now + windowMs,
  }
}

/**
 * Extracts client IP from standard proxy headers, prioritizing trusted platform headers
 * (Vercel, Cloudflare) before fallbacks to prevent header spoofing.
 */
export function getClientIp(request: Request): string {
  const vercelIp = request.headers.get('x-vercel-ip')
  if (vercelIp) {
    return vercelIp.trim()
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return '127.0.0.1'
}

/**
 * Rate limit helper for route handlers.
 * Returns a 429 NextResponse if rate limit exceeded, or null if allowed.
 */
export function enforceRateLimit(
  request: Request,
  routeIdentifier: string,
  limit = 15,
  windowMs = 60_000
): NextResponse | null {
  // Allow disabling in tests if specified
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT) {
    return null
  }

  const ip = getClientIp(request)
  const key = `${routeIdentifier}:${ip}`
  const result = checkRateLimit(key, limit, windowMs)

  if (!result.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000))
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment before trying again.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
        },
      }
    )
  }

  return null
}

/**
 * Resets the in-memory rate limit store (used in unit tests).
 */
export function resetRateLimitStore(): void {
  rateLimitMap.clear()
}
