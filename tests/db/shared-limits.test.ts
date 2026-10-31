// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asRole, callRpc, createMigratedDatabase } from '../helpers/pglite'
import { createEventArgs, samplePlan } from './fixtures'

interface Hit {
  allowed: boolean
  remaining: number
  retry_after_seconds: number
}

let db: PGlite
beforeAll(async () => {
  db = await createMigratedDatabase()
}, 60_000)
afterAll(async () => {
  await db.close()
})
beforeEach(async () => {
  await db.exec('TRUNCATE public.rate_limit_hits, public.model_usage')
})

const hit = (bucket: string, limit = 3, windowSeconds = 60) =>
  callRpc<Hit>(
    db,
    'consume_rate_limit',
    { p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds },
    'service_role'
  )

describe('who may use the counters (a public key must not)', () => {
  it.each(['anon', 'authenticated'] as const)(
    'the %s role cannot call the counter functions',
    async (role) => {
      const limit = await callRpc(
        db,
        'consume_rate_limit',
        { p_bucket: 'x', p_limit: 1, p_window_seconds: 60 },
        role
      )
      expect(limit.error?.message).toMatch(/permission denied/i)
      const model = await callRpc(db, 'consume_model_call', { p_cap: 5 }, role)
      expect(model.error?.message).toMatch(/permission denied/i)
    }
  )

  it('nobody can call the internal helper through the API, not even the service role', async () => {
    for (const role of ['anon', 'authenticated', 'service_role'] as const) {
      const direct = await callRpc(
        db,
        'mehfil_hit_rate_limit',
        { p_bucket: 'x', p_limit: 1, p_window_seconds: 60 },
        role
      )
      expect(direct.error?.message).toMatch(/permission denied/i)
    }
  })

  it('the counter tables are closed to the browser', async () => {
    for (const table of ['rate_limit_hits', 'model_usage']) {
      await expect(
        asRole(db, 'anon', () => db.query(`SELECT * FROM public.${table}`))
      ).rejects.toThrow(/permission denied/i)
      await expect(
        asRole(db, 'anon', () => db.query(`DELETE FROM public.${table}`))
      ).rejects.toThrow(/permission denied/i)
    }
  })
})

describe('consume_rate_limit', () => {
  it('allows exactly the limit inside the window, then refuses', async () => {
    const results: Hit[] = []
    for (let i = 0; i < 5; i++) results.push((await hit('route:1.2.3.4', 3)).data!)
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false, false])
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0, 0])
  })

  it('tells a blocked caller how long to wait, never more than the window', async () => {
    for (let i = 0; i < 3; i++) await hit('b', 3, 60)
    const blocked = (await hit('b', 3, 60)).data!
    expect(blocked.allowed).toBe(false)
    expect(blocked.retry_after_seconds).toBeGreaterThan(0)
    expect(blocked.retry_after_seconds).toBeLessThanOrEqual(60)
  })

  it('refused attempts do not extend the lockout or fill the bucket further', async () => {
    for (let i = 0; i < 3; i++) await hit('b', 3)
    for (let i = 0; i < 10; i++) await hit('b', 3)
    const rows = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket = 'b'"
    )
    expect(rows.rows[0].n).toBe(3)
  })

  it('keeps buckets independent', async () => {
    for (let i = 0; i < 3; i++) await hit('claim:1.1.1.1', 3)
    expect((await hit('claim:1.1.1.1', 3)).data!.allowed).toBe(false)
    expect((await hit('claim:2.2.2.2', 3)).data!.allowed).toBe(true)
    expect((await hit('style:1.1.1.1', 3)).data!.allowed).toBe(true)
  })

  it('lets a caller back in once old hits fall out of the window', async () => {
    for (let i = 0; i < 3; i++) await hit('b', 3, 60)
    expect((await hit('b', 3, 60)).data!.allowed).toBe(false)
    await db.exec(
      "UPDATE public.rate_limit_hits SET hit_at = now() - interval '61 seconds' WHERE bucket = 'b'"
    )
    const again = (await hit('b', 3, 60)).data!
    expect(again).toMatchObject({ allowed: true, remaining: 2 })
  })

  it('never lets concurrent callers exceed the limit', async () => {
    const outcomes = await Promise.all(Array.from({ length: 40 }, () => hit('burst', 10)))
    expect(outcomes.filter((o) => o.data!.allowed)).toHaveLength(10)
  })

  it('rejects nonsense arguments', async () => {
    const bad: Array<[string, number, number]> = [
      ['', 3, 60],
      ['x'.repeat(201), 3, 60],
      ['x', 0, 60],
      ['x', 3, 0],
      ['x', 3, 86401],
    ]
    for (const [bucket, limit, window] of bad) {
      const result = await hit(bucket, limit, window)
      expect(result.error).not.toBeNull()
    }
  })
})

describe('consume_model_call', () => {
  const consume = (cap: number) =>
    callRpc<boolean>(db, 'consume_model_call', { p_cap: cap }, 'service_role').then((r) => r.data)

  it('allows calls up to the cap and then refuses', async () => {
    const results = []
    for (let i = 0; i < 5; i++) results.push(await consume(3))
    expect(results).toEqual([true, true, true, false, false])
  })

  it('a cap of zero turns model calls off', async () => {
    expect(await consume(0)).toBe(false)
    const rows = await db.query('SELECT 1 FROM public.model_usage')
    expect(rows.rows).toHaveLength(0)
  })

  it('stops exactly at the cap and never counts past it', async () => {
    await Promise.all(Array.from({ length: 30 }, () => consume(7)))
    const rows = await db.query<{ calls: number }>('SELECT calls FROM public.model_usage')
    expect(rows.rows[0].calls).toBe(7)
  })

  it('starts a fresh allowance on a new day', async () => {
    for (let i = 0; i < 3; i++) await consume(3)
    expect(await consume(3)).toBe(false)
    await db.exec('UPDATE public.model_usage SET day = day - 1')
    expect(await consume(3)).toBe(true)
  })

  it('rejects a negative or absurd cap', async () => {
    for (const cap of [-1, 1_000_001]) {
      const result = await callRpc(db, 'consume_model_call', { p_cap: cap }, 'service_role')
      expect(result.error).not.toBeNull()
    }
  })
})

describe('create_event circuit breaker (#6)', () => {
  const create = () =>
    callRpc<{ event_id: string }>(db, 'create_event', createEventArgs(samplePlan()))
  const fillBreaker = (hits: number) =>
    db.query(
      "INSERT INTO public.rate_limit_hits (bucket, hit_at) SELECT 'create_event:all', now() FROM generate_series(1, $1)",
      [hits]
    )

  it('creates plans normally', async () => {
    const result = await create()
    expect(result.error).toBeNull()
    expect(result.data?.event_id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('refuses once 300 plans were created in ten minutes, and creates nothing', async () => {
    await fillBreaker(300)
    const before = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM public.events')
    const refused = await create()
    expect(refused.error?.message).toMatch(/too many plans/i)
    expect(refused.error?.code).toBe('53400')
    const after = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM public.events')
    expect(after.rows[0].n).toBe(before.rows[0].n)
  })

  it('allows the last slot, then closes', async () => {
    await fillBreaker(299)
    expect((await create()).error).toBeNull()
    expect((await create()).error?.code).toBe('53400')
  })

  it('reopens by itself when the window passes', async () => {
    await fillBreaker(300)
    expect((await create()).error?.code).toBe('53400')
    await db.exec("UPDATE public.rate_limit_hits SET hit_at = now() - interval '11 minutes'")
    expect((await create()).error).toBeNull()
  })

  it('malformed requests do not use up the allowance', async () => {
    for (let i = 0; i < 20; i++) {
      await callRpc(db, 'create_event', { ...createEventArgs(), p_title: '   ' })
    }
    const rows = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket = 'create_event:all'"
    )
    expect(rows.rows[0].n).toBe(0)
  })

  it('a failed creation does not leave a hit behind', async () => {
    const bad = await callRpc(db, 'create_event', { ...createEventArgs(), p_event_type: 'funeral' })
    expect(bad.error).not.toBeNull()
    const rows = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket = 'create_event:all'"
    )
    expect(rows.rows[0].n).toBe(0)
  })

  it('still hands back the same shape of result as before', async () => {
    const result = await callRpc<Record<string, unknown>>(
      db,
      'create_event',
      createEventArgs(samplePlan())
    )
    expect(Object.keys(result.data!).sort()).toEqual(
      ['edit_key', 'event_id', 'share_key', 'version_id', 'version_number'].sort()
    )
  })
})
