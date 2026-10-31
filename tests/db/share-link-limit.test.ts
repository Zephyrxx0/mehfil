// @vitest-environment node
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asRole, callRpc, createMigratedDatabase } from '../helpers/pglite'
import { createEventArgs, samplePlan, type CreatedEvent } from './fixtures'

/**
 * Per-plan limit on opening a family share link (120 per 60 seconds), enforced in the database
 * because the public key lets anyone call get_shared_plan directly. Only keys that match a real
 * active plan are counted.
 */

const LIMIT = 120

let db: PGlite
beforeAll(async () => {
  db = await createMigratedDatabase()
}, 60_000)
afterAll(async () => {
  await db.close()
})

async function newEvent(): Promise<CreatedEvent> {
  const { data, error } = await callRpc<CreatedEvent>(
    db,
    'create_event',
    createEventArgs(samplePlan())
  )
  expect(error).toBeNull()
  return data as CreatedEvent
}

async function open(shareKey: string | null) {
  const { data, error } = await callRpc<Array<{ id: string }>>(db, 'get_shared_plan', {
    p_share_key: shareKey,
  })
  expect(error).toBeNull()
  return data as Array<{ id: string }>
}

/** Opens the link `times` times and returns how many answers had a plan in them. */
async function openTimes(shareKey: string, times: number): Promise<number> {
  let opened = 0
  for (let i = 0; i < times; i++) {
    opened += (await open(shareKey)).length
  }
  return opened
}

const bucketOf = (eventId: string) => `share_open:${eventId}`

const hitsIn = async (bucket: string) =>
  (
    await db.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket = $1',
      [bucket]
    )
  ).rows[0].n

const allHits = async () =>
  (await db.query<{ n: number }>('SELECT count(*)::int AS n FROM public.rate_limit_hits')).rows[0].n

describe('limit per plan', () => {
  it('allows 120 opens in a minute and returns nothing for the 121st', async () => {
    const plan = await newEvent()
    expect(await openTimes(plan.share_key, LIMIT)).toBe(LIMIT)
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(LIMIT)

    const refused = await open(plan.share_key)
    expect(refused).toEqual([])
    // A refused open records nothing, so the lockout does not extend itself.
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(LIMIT)
  })

  it('does not lock at 119 opens: the 120th still works', async () => {
    const plan = await newEvent()
    expect(await openTimes(plan.share_key, LIMIT - 1)).toBe(LIMIT - 1)
    expect(await open(plan.share_key)).toHaveLength(1)
  })

  it('leaves another plan’s link working while one is locked out', async () => {
    const locked = await newEvent()
    const other = await newEvent()
    await openTimes(locked.share_key, LIMIT)
    expect(await open(locked.share_key)).toEqual([])

    const shared = await open(other.share_key)
    expect(shared).toHaveLength(1)
    expect(shared[0].id).toBe(other.event_id)
    expect(await hitsIn(bucketOf(other.event_id))).toBe(1)
  })

  it('opens again once the recorded hits are older than 60 seconds', async () => {
    const plan = await newEvent()
    await openTimes(plan.share_key, LIMIT)
    expect(await open(plan.share_key)).toEqual([])

    await db.query(
      `UPDATE public.rate_limit_hits SET hit_at = hit_at - interval '61 seconds' WHERE bucket = $1`,
      [bucketOf(plan.event_id)]
    )
    const shared = await open(plan.share_key)
    expect(shared).toHaveLength(1)
    expect(shared[0].id).toBe(plan.event_id)
    // The aged rows were cleared by the helper; only the new open is on record.
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(1)
  })

  it('still returns the same fields as before when it answers', async () => {
    const plan = await newEvent()
    const shared = await callRpc<Array<Record<string, unknown>>>(db, 'get_shared_plan', {
      p_share_key: plan.share_key,
    })
    expect(shared.data).toHaveLength(1)
    expect(Object.keys(shared.data![0]).sort()).toEqual(
      [
        'city',
        'event_date',
        'event_type',
        'guest_count',
        'id',
        'lines',
        'protected_category',
        'status',
        'title',
        'total_budget_paise',
      ].sort()
    )
    expect(shared.data![0]).toMatchObject({ id: plan.event_id, city: 'Jaipur', status: 'active' })
  })
})

describe('keys that match no active plan cost nothing', () => {
  it('writes nothing for 500 random keys and returns no rows', async () => {
    const plan = await newEvent()
    await open(plan.share_key) // a real hit, so the table is not empty
    const before = await allHits()
    expect(before).toBeGreaterThan(0)

    for (let i = 0; i < 500; i++) {
      expect(await open(randomBytes(32).toString('hex'))).toEqual([])
    }
    expect(await allHits()).toBe(before)
  }, 60_000)

  it('does not touch a real plan’s bucket, so random keys cannot lock a family out', async () => {
    const plan = await newEvent()
    for (let i = 0; i < LIMIT + 10; i++) {
      expect(await open(randomBytes(32).toString('hex'))).toEqual([])
    }
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(0)
    expect(await open(plan.share_key)).toHaveLength(1)
  })

  it('returns nothing and writes nothing for keys of invalid length or NULL', async () => {
    const before = await allHits()
    for (const key of [null, '', 'x', 'a'.repeat(15), 'a'.repeat(257), 'a'.repeat(5000)]) {
      expect(await open(key)).toEqual([])
    }
    expect(await allHits()).toBe(before)
  })

  it('returns nothing and writes nothing for the edit key or an archived plan', async () => {
    const plan = await newEvent()
    const archived = await newEvent()
    await db.query("UPDATE public.events SET status = 'archived' WHERE id = $1", [
      archived.event_id,
    ])
    const before = await allHits()

    expect(await open(plan.edit_key)).toEqual([])
    expect(await open(archived.share_key)).toEqual([])
    expect(await allHits()).toBe(before)
    expect(await hitsIn(bucketOf(archived.event_id))).toBe(0)
  })

  it('returns nothing and writes nothing for a revoked share key; the new key works', async () => {
    const plan = await newEvent()
    const regenerated = await callRpc<{ share_key: string }>(db, 'regenerate_share_key', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    const fresh = regenerated.data!.share_key
    const before = await allHits()

    expect(await open(plan.share_key)).toEqual([])
    expect(await allHits()).toBe(before)
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(0)

    expect(await open(fresh)).toHaveLength(1)
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(1)
  })

  it('a revoked key keeps returning nothing even after the plan’s bucket is full', async () => {
    const plan = await newEvent()
    const regenerated = await callRpc<{ share_key: string }>(db, 'regenerate_share_key', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    await openTimes(regenerated.data!.share_key, LIMIT)
    expect(await open(regenerated.data!.share_key)).toEqual([])
    expect(await open(plan.share_key)).toEqual([])
    expect(await hitsIn(bucketOf(plan.event_id))).toBe(LIMIT)
  })
})

describe('definition and access', () => {
  it('is VOLATILE and SECURITY DEFINER with a pinned search_path', async () => {
    const { rows } = await db.query<{
      provolatile: string
      prosecdef: boolean
      proconfig: string[] | null
    }>(
      `SELECT p.provolatile, p.prosecdef, p.proconfig
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'get_shared_plan'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].provolatile).toBe('v')
    expect(rows[0].prosecdef).toBe(true)
    expect(rows[0].proconfig?.some((c) => c.startsWith('search_path='))).toBe(true)
  })

  it('can be executed by anon and service_role, not by authenticated or PUBLIC', async () => {
    const { rows } = await db.query<{ role: string; allowed: boolean }>(
      `SELECT r.role, has_function_privilege(r.role, 'public.get_shared_plan(text)'::regprocedure, 'EXECUTE') AS allowed
       FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role)
       ORDER BY 1`
    )
    expect(Object.fromEntries(rows.map((r) => [r.role, r.allowed]))).toEqual({
      anon: true,
      authenticated: false,
      service_role: true,
    })

    const acl = await db.query<{ acl: string | null }>(
      `SELECT proacl::text AS acl FROM pg_proc WHERE oid = 'public.get_shared_plan(text)'::regprocedure`
    )
    // An ACL entry with an empty grantee (`=X/...`) means PUBLIC can execute.
    expect(acl.rows[0].acl ?? '').not.toMatch(/(^\{|,)=X\//)

    const plan = await newEvent()
    const denied = await callRpc(
      db,
      'get_shared_plan',
      { p_share_key: plan.share_key },
      'authenticated'
    )
    expect(denied.error?.message).toMatch(/permission denied/i)
    const allowed = await callRpc<unknown[]>(
      db,
      'get_shared_plan',
      { p_share_key: plan.share_key },
      'service_role'
    )
    expect(allowed.data).toHaveLength(1)
  })

  it('keeps the counter table closed to the browser roles', async () => {
    for (const role of ['anon', 'authenticated'] as const) {
      await expect(
        asRole(db, role, () => db.query('SELECT * FROM public.rate_limit_hits'))
      ).rejects.toThrow(/permission denied/i)
    }
  })
})
