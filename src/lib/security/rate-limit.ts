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

/** Bucket shared by every request whose address cannot be determined. */
export const UNKNOWN_CLIENT = 'unknown'

/**
 * Resolves the client address from headers the hosting platform sets itself.
 *
 * Only `x-vercel-forwarded-for` and `x-real-ip` are trusted first: Vercel overwrites both,
 * so a caller cannot choose them. `x-vercel-ip` is not a documented client-address header and
 * `cf-connecting-ip` is only meaningful behind Cloudflare, so a forged value in either would
 * hand an attacker a fresh bucket per request; they are ignored. As a last resort we use the
 * LAST `x-forwarded-for` entry, which is the one appended by the nearest trusted proxy, never
 * the first, which the client controls.
 */
export function getClientIp(request: Request): string {
  const platformHeader =
    request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip')
  const platformIp = platformHeader?.split(',')[0]?.trim()
  if (platformIp) return platformIp

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const nearestProxyEntry = forwardedFor.split(',').at(-1)?.trim()
    if (nearestProxyEntry) return nearestProxyEntry
  }
  return UNKNOWN_CLIENT
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
