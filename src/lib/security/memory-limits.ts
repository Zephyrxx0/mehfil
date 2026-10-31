/**
 * In-process counters. They are exact for a single server instance, which covers local use and
 * development, and they are the fallback when the shared counters in Postgres are not configured
 * or cannot be reached. On serverless hosting each warm instance has its own copy, which is why
 * `shared-limits.ts` prefers the database (ADR-0011).
 */

interface RateLimitRecord {
  timestamps: number[]
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up stale records every 5 minutes to prevent memory growth
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
  /** Unix time in milliseconds when the caller may try again. */
  resetTime: number
}

/** Checks a sliding-window rate limit for a given key (for example route plus client address). */
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
    return { success: false, limit, remaining: 0, resetTime: record.timestamps[0] + windowMs }
  }

  record.timestamps.push(now)
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetTime: now + windowMs,
  }
}

/** Resets the rate-limit store (used in unit tests). */
export function resetRateLimitStore(): void {
  rateLimitMap.clear()
}

let currentDay = ''
let callsToday = 0

function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/** Takes one model call from today's allowance, or returns false once `cap` is reached. */
export function takeMemoryModelCall(cap: number, now: Date = new Date()): boolean {
  const day = utcDay(now)
  if (day !== currentDay) {
    currentDay = day
    callsToday = 0
  }
  if (callsToday >= cap) return false
  callsToday += 1
  return true
}

/** Clears the daily model counter (used in unit tests). */
export function resetMemoryModelBudget(): void {
  currentDay = ''
  callsToday = 0
}
