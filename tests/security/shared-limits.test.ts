// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import {
  createPostgresBackend,
  memoryBackend,
  withFallback,
  type LimitBackend,
} from '@/lib/security/shared-limits'
import { resetMemoryModelBudget, resetRateLimitStore } from '@/lib/security/memory-limits'
import { createMigratedDatabase, createPgliteRpcClient } from '../helpers/pglite'

let db: PGlite
let postgres: LimitBackend
beforeAll(async () => {
  db = await createMigratedDatabase()
  postgres = createPostgresBackend(createPgliteRpcClient(db, 'service_role'))
}, 60_000)
afterAll(async () => {
  await db.close()
})
beforeEach(async () => {
  await db.exec('TRUNCATE public.rate_limit_hits, public.model_usage')
  resetRateLimitStore()
  resetMemoryModelBudget()
})

describe('Postgres backend, against the real SQL', () => {
  it('allows the limit, then refuses with a wait time', async () => {
    const results = []
    for (let i = 0; i < 4; i++) results.push(await postgres.hit('claim:abc', 3, 60_000))
    expect(results.map((r) => r.success)).toEqual([true, true, true, false])
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0])

    const blocked = results[3]
    const waitMs = blocked.resetTime - Date.now()
    expect(waitMs).toBeGreaterThan(0)
    expect(waitMs).toBeLessThanOrEqual(60_000)
  })

  it('shares one count between two separate server instances', async () => {
    // Two instances = two backends over the same database, with no memory in common.
    const instanceA = createPostgresBackend(createPgliteRpcClient(db, 'service_role'))
    const instanceB = createPostgresBackend(createPgliteRpcClient(db, 'service_role'))

    expect((await instanceA.hit('shared', 2, 60_000)).success).toBe(true)
    expect((await instanceB.hit('shared', 2, 60_000)).success).toBe(true)
    expect((await instanceA.hit('shared', 2, 60_000)).success).toBe(false) // the limit is 2 in total
    expect((await instanceB.hit('shared', 2, 60_000)).success).toBe(false)
  })

  it('shares the daily model allowance between instances', async () => {
    const instanceA = createPostgresBackend(createPgliteRpcClient(db, 'service_role'))
    const instanceB = createPostgresBackend(createPgliteRpcClient(db, 'service_role'))
    const taken = [
      await instanceA.takeModelCall(3),
      await instanceB.takeModelCall(3),
      await instanceA.takeModelCall(3),
      await instanceB.takeModelCall(3),
      await instanceA.takeModelCall(3),
    ]
    expect(taken).toEqual([true, true, true, false, false])
  })

  it('a cap of zero allows nothing', async () => {
    expect(await postgres.takeModelCall(0)).toBe(false)
  })

  it('the public key cannot use it: the same backend over the anon role is refused', async () => {
    const asPublic = createPostgresBackend(createPgliteRpcClient(db, 'anon'))
    await expect(asPublic.hit('x', 1, 60_000)).rejects.toThrow(/permission denied/i)
    await expect(asPublic.takeModelCall(5)).rejects.toThrow(/permission denied/i)
  })

  it('rounds sub-second windows up to a whole second', async () => {
    expect((await postgres.hit('tiny', 1, 250)).success).toBe(true)
    expect((await postgres.hit('tiny', 1, 250)).success).toBe(false)
  })
})

describe('memory backend', () => {
  it('limits within one process', async () => {
    const results = []
    for (let i = 0; i < 3; i++) results.push((await memoryBackend.hit('m', 2, 60_000)).success)
    expect(results).toEqual([true, true, false])
  })

  it('counts model calls per day', async () => {
    const day = new Date('2026-10-31T10:00:00Z')
    expect(await memoryBackend.takeModelCall(1, day)).toBe(true)
    expect(await memoryBackend.takeModelCall(1, day)).toBe(false)
    expect(await memoryBackend.takeModelCall(1, new Date('2026-11-01T00:00:01Z'))).toBe(true)
  })
})

describe('withFallback: a broken database must degrade protection, never remove it', () => {
  const broken: LimitBackend = {
    hit: vi.fn(async () => {
      throw new Error('database down')
    }),
    takeModelCall: vi.fn(async () => {
      throw new Error('database down')
    }),
  }
  afterEach(() => vi.clearAllMocks())

  it('answers from memory when the database fails, so the limit still holds', async () => {
    const limits = withFallback(broken, memoryBackend)
    const results = []
    for (let i = 0; i < 4; i++) results.push((await limits.hit('fb', 3, 60_000)).success)
    expect(results).toEqual([true, true, true, false])
  })

  it('stops calling a failing database for a while, so requests are not slowed', async () => {
    let now = 1_000_000
    const limits = withFallback(broken, memoryBackend, () => now)

    await limits.hit('a', 5, 60_000)
    await limits.hit('b', 5, 60_000)
    await limits.hit('c', 5, 60_000)
    expect(broken.hit).toHaveBeenCalledTimes(1) // tried once, then rested

    now += 31_000 // the rest period is over
    await limits.hit('d', 5, 60_000)
    expect(broken.hit).toHaveBeenCalledTimes(2)
  })

  it('goes back to the database once it recovers', async () => {
    let now = 0
    let healthy = false
    const flaky: LimitBackend = {
      hit: vi.fn(async (bucket, limit, windowMs) => {
        if (!healthy) throw new Error('down')
        return postgres.hit(bucket, limit, windowMs)
      }),
      takeModelCall: vi.fn(async () => true),
    }
    const limits = withFallback(flaky, memoryBackend, () => now)

    await limits.hit('r', 5, 60_000) // fails, falls back
    healthy = true
    now += 31_000
    await limits.hit('r2', 5, 60_000) // database again
    const rows = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket = 'r2'"
    )
    expect(rows.rows[0].n).toBe(1)
  })

  it('also falls back for the model allowance', async () => {
    const limits = withFallback(broken, memoryBackend)
    expect(await limits.takeModelCall(1)).toBe(true)
    expect(await limits.takeModelCall(1)).toBe(false)
  })

  it('does not hide a database that answers correctly', async () => {
    const limits = withFallback(postgres, memoryBackend)
    for (let i = 0; i < 2; i++) await limits.hit('ok', 2, 60_000)
    expect((await limits.hit('ok', 2, 60_000)).success).toBe(false)
    const rows = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket = 'ok'"
    )
    expect(rows.rows[0].n).toBe(2) // it really went through the database
  })
})

describe('Postgres backend rejects answers it does not understand', () => {
  it('treats a malformed reply as a failure, so the fallback takes over', async () => {
    const odd = createPostgresBackend({
      rpc: async () => ({ data: { allowed: 'yes' }, error: null }),
    } as never)
    await expect(odd.hit('x', 1, 1000)).rejects.toThrow(/unexpected/)
    const oddModel = createPostgresBackend({
      rpc: async () => ({ data: 'true', error: null }),
    } as never)
    await expect(oddModel.takeModelCall(1)).rejects.toThrow(/unexpected/)
  })
})
