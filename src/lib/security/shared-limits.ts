import { z } from 'zod'
import { createLogger } from '@/lib/logger'
import { getServiceRpc } from '@/lib/supabase/server'
import type { RpcClient } from '@/lib/storage/cloud-plans'
import { checkRateLimit, takeMemoryModelCall, type RateLimitResult } from './memory-limits'

const logger = createLogger('shared-limits')

/** After a database failure, skip the database for this long so requests are not slowed. */
const COOL_DOWN_MS = 30_000

/**
 * Abuse limits that hold across every server instance (ADR-0011).
 *
 * With the server-only service key configured, counters live in Postgres and one count is shared
 * by all instances. Without it, or while the database is unreachable, the same limits run in
 * memory: exact for one instance, and still a real brake, just not a shared one.
 */
export interface LimitBackend {
  hit(bucket: string, limit: number, windowMs: number): Promise<RateLimitResult>
  takeModelCall(cap: number, now?: Date): Promise<boolean>
}

export const memoryBackend: LimitBackend = {
  hit: async (bucket, limit, windowMs) => checkRateLimit(bucket, limit, windowMs),
  takeModelCall: async (cap, now) => takeMemoryModelCall(cap, now),
}

const HitSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().int().nonnegative(),
  retry_after_seconds: z.number().int().nonnegative(),
})

/** Counters stored in Postgres, reached with the server-only service key. */
export function createPostgresBackend(client: RpcClient): LimitBackend {
  return {
    async hit(bucket, limit, windowMs) {
      const { data, error } = await client.rpc('consume_rate_limit', {
        p_bucket: bucket,
        p_limit: limit,
        p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
      })
      if (error) throw new Error(`consume_rate_limit failed: ${error.message}`)
      const parsed = HitSchema.safeParse(data)
      if (!parsed.success) throw new Error('consume_rate_limit returned an unexpected answer')

      const now = Date.now()
      return {
        success: parsed.data.allowed,
        limit,
        remaining: parsed.data.remaining,
        resetTime: now + (parsed.data.allowed ? windowMs : parsed.data.retry_after_seconds * 1000),
      }
    },

    async takeModelCall(cap) {
      const { data, error } = await client.rpc('consume_model_call', { p_cap: cap })
      if (error) throw new Error(`consume_model_call failed: ${error.message}`)
      if (typeof data !== 'boolean')
        throw new Error('consume_model_call returned an unexpected answer')
      return data
    },
  }
}

/**
 * Prefers `primary`; when it throws, answers from `fallback` and leaves `primary` alone for a
 * short while. A broken database therefore degrades protection to per-instance, never to none,
 * and never makes every request wait for a timeout.
 */
export function withFallback(
  primary: LimitBackend,
  fallback: LimitBackend,
  now: () => number = Date.now
): LimitBackend {
  let unhealthyUntil = 0

  async function attempt<T>(run: (backend: LimitBackend) => Promise<T>): Promise<T> {
    if (now() >= unhealthyUntil) {
      try {
        return await run(primary)
      } catch (err) {
        unhealthyUntil = now() + COOL_DOWN_MS
        logger.warn('shared counters unavailable, using per-instance counters for a while', { err })
      }
    }
    return run(fallback)
  }

  return {
    hit: (bucket, limit, windowMs) => attempt((b) => b.hit(bucket, limit, windowMs)),
    takeModelCall: (cap, at) => attempt((b) => b.takeModelCall(cap, at)),
  }
}

let cached: { client: RpcClient; backend: LimitBackend } | null = null

/** The backend to use right now: Postgres when the service key is set, otherwise memory. */
export function getLimits(): LimitBackend {
  const client = getServiceRpc()
  if (!client) return memoryBackend
  // getServiceRpc() returns the same client for the same credentials, so identity is a safe key.
  if (cached?.client !== client) {
    cached = { client, backend: withFallback(createPostgresBackend(client), memoryBackend) }
  }
  return cached.backend
}

/** Test hook: forget the cached backend and its failure state. */
export function resetLimitsForTests(): void {
  cached = null
}
