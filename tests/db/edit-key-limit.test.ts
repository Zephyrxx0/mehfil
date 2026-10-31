// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asRole, callRpc, createMigratedDatabase } from '../helpers/pglite'
import { createEventArgs, samplePlan, type CreatedEvent } from './fixtures'

/**
 * Per-plan limit on failed edit-key attempts (20 per 10 minutes), enforced in the database because
 * the public key lets anyone call the RPCs directly.
 */

const LIMIT = 20
const WRONG_KEY = 'f'.repeat(64)

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

const verify = async (eventId: string, key: string | null) => {
  const { data, error } = await callRpc<boolean>(db, 'verify_edit_key', {
    p_event_id: eventId,
    p_edit_key: key,
  })
  expect(error).toBeNull()
  return data
}

const failureCount = async (eventId: string) =>
  (
    await db.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM public.edit_key_failures WHERE event_id = $1',
      [eventId]
    )
  ).rows[0].n

async function failTimes(eventId: string, times: number) {
  for (let i = 0; i < times; i++) {
    expect(await verify(eventId, WRONG_KEY)).toBe(false)
  }
}

describe('lockout after repeated wrong keys', () => {
  it('refuses even the correct key once a plan has 20 recent failures, on every RPC', async () => {
    const plan = await newEvent()
    await failTimes(plan.event_id, LIMIT)
    expect(await failureCount(plan.event_id)).toBe(LIMIT)

    expect(await verify(plan.event_id, plan.edit_key)).toBe(false)

    const editable = await callRpc(db, 'get_editable_plan', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    expect(editable.data).toBeNull()

    const history = await callRpc(db, 'list_plan_versions', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    expect(history.data).toEqual([])

    const save = await callRpc<{ status: string }>(db, 'save_plan_version', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
      p_parent_version_id: plan.version_id,
      p_snapshot: samplePlan(),
      p_reason: 'during lockout',
    })
    expect(save.data?.status).toBe('unauthorized')

    const regenerate = await callRpc(db, 'regenerate_share_key', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    expect(regenerate.data).toBeNull()

    // Refused attempts during the lockout are not recorded, so the lockout does not extend itself.
    expect(await failureCount(plan.event_id)).toBe(LIMIT)
  })

  it('does not lock at 19 failures: the correct key still works', async () => {
    const plan = await newEvent()
    await failTimes(plan.event_id, LIMIT - 1)
    expect(await verify(plan.event_id, plan.edit_key)).toBe(true)
  })

  it('leaves a different plan unaffected during the lockout', async () => {
    const locked = await newEvent()
    const other = await newEvent()
    await failTimes(locked.event_id, LIMIT)

    expect(await verify(locked.event_id, locked.edit_key)).toBe(false)
    expect(await verify(other.event_id, other.edit_key)).toBe(true)
    expect(await failureCount(other.event_id)).toBe(0)

    // A wrong key on the locked plan with the other plan's key does not help either.
    expect(await verify(locked.event_id, other.edit_key)).toBe(false)
  })

  it('works again once the failures are older than 10 minutes', async () => {
    const plan = await newEvent()
    await failTimes(plan.event_id, LIMIT)
    expect(await verify(plan.event_id, plan.edit_key)).toBe(false)

    await db.query(
      `UPDATE public.edit_key_failures SET failed_at = now() - interval '11 minutes' WHERE event_id = $1`,
      [plan.event_id]
    )
    expect(await verify(plan.event_id, plan.edit_key)).toBe(true)
    const plan2 = await callRpc<{ event: { id: string } }>(db, 'get_editable_plan', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    expect(plan2.data?.event.id).toBe(plan.event_id)
  })

  it('still locks when only part of the failures have aged out', async () => {
    const plan = await newEvent()
    await failTimes(plan.event_id, LIMIT)
    await db.query(
      `UPDATE public.edit_key_failures SET failed_at = now() - interval '11 minutes'
       WHERE ctid IN (SELECT ctid FROM public.edit_key_failures WHERE event_id = $1 LIMIT 5)`,
      [plan.event_id]
    )
    // 15 recent failures: below the limit, so the correct key works.
    expect(await verify(plan.event_id, plan.edit_key)).toBe(true)
  })
})

describe('what counts as a failure', () => {
  it('records nothing for a correct key, however often it is used', async () => {
    const plan = await newEvent()
    for (let i = 0; i < LIMIT + 5; i++) {
      expect(await verify(plan.event_id, plan.edit_key)).toBe(true)
    }
    const editable = await callRpc(db, 'get_editable_plan', {
      p_event_id: plan.event_id,
      p_edit_key: plan.edit_key,
    })
    expect(editable.data).not.toBeNull()
    expect(await failureCount(plan.event_id)).toBe(0)
  })

  it('records a wrong key and a wrong-length key for an existing plan, not a missing key', async () => {
    const plan = await newEvent()
    expect(await verify(plan.event_id, WRONG_KEY)).toBe(false)
    expect(await failureCount(plan.event_id)).toBe(1)
    expect(await verify(plan.event_id, 'short')).toBe(false)
    expect(await failureCount(plan.event_id)).toBe(2)
    expect(await verify(plan.event_id, 'x'.repeat(257))).toBe(false)
    expect(await failureCount(plan.event_id)).toBe(3)
    expect(await verify(plan.event_id, null)).toBe(false)
    expect(await failureCount(plan.event_id)).toBe(3)
  })

  it('counts the share key used as an edit key as a failure', async () => {
    const plan = await newEvent()
    expect(await verify(plan.event_id, plan.share_key)).toBe(false)
    expect(await failureCount(plan.event_id)).toBe(1)
  })

  it('records nothing for an unknown or archived plan and gives the same answer as a wrong key', async () => {
    const unknown = '00000000-0000-0000-0000-000000000000'
    expect(await verify(unknown, WRONG_KEY)).toBe(false)
    expect(await verify(unknown, 'short')).toBe(false)
    expect(await failureCount(unknown)).toBe(0)

    const archived = await newEvent()
    await db.query("UPDATE public.events SET status = 'archived' WHERE id = $1", [
      archived.event_id,
    ])
    expect(await verify(archived.event_id, archived.edit_key)).toBe(false)
    expect(await verify(archived.event_id, WRONG_KEY)).toBe(false)
    expect(await failureCount(archived.event_id)).toBe(0)
  })

  it('treats a NULL plan id as a plain false', async () => {
    const result = await callRpc<boolean>(db, 'verify_edit_key', {
      p_event_id: null,
      p_edit_key: WRONG_KEY,
    })
    expect(result.error).toBeNull()
    expect(result.data).toBe(false)
  })
})

describe('cleanup', () => {
  it('drops this plan\u2019s failures older than an hour when it records a new one', async () => {
    const plan = await newEvent()
    await failTimes(plan.event_id, 3)
    await db.query(
      `UPDATE public.edit_key_failures SET failed_at = now() - interval '2 hours' WHERE event_id = $1`,
      [plan.event_id]
    )
    expect(await failureCount(plan.event_id)).toBe(3)
    await failTimes(plan.event_id, 1)
    expect(await failureCount(plan.event_id)).toBe(1)
  })
})

describe('access and definitions', () => {
  it.each(['anon', 'authenticated'] as const)(
    'the %s role cannot read, write or delete edit_key_failures',
    async (role) => {
      const plan = await newEvent()
      await expect(
        asRole(db, role, () => db.query('SELECT * FROM public.edit_key_failures'))
      ).rejects.toThrow(/permission denied/i)
      await expect(
        asRole(db, role, () =>
          db.query('INSERT INTO public.edit_key_failures (event_id) VALUES ($1)', [plan.event_id])
        )
      ).rejects.toThrow(/permission denied/i)
      await expect(
        asRole(db, role, () => db.query('DELETE FROM public.edit_key_failures'))
      ).rejects.toThrow(/permission denied/i)
      await expect(
        asRole(db, role, () => db.query('UPDATE public.edit_key_failures SET failed_at = now()'))
      ).rejects.toThrow(/permission denied/i)
    }
  )

  it('keeps row-level security on for the table and indexes (event_id, failed_at)', async () => {
    const table = await db.query<{ relrowsecurity: boolean }>(
      `SELECT relrowsecurity FROM pg_class WHERE oid = 'public.edit_key_failures'::regclass`
    )
    expect(table.rows[0].relrowsecurity).toBe(true)
    const indexes = await db.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes WHERE tablename = 'edit_key_failures'`
    )
    expect(indexes.rows.map((r) => r.indexdef).join('\n')).toContain('(event_id, failed_at)')
  })

  it('declares the helper and every caller VOLATILE, so none is a STABLE function that writes', async () => {
    const { rows } = await db.query<{ proname: string; provolatile: string }>(
      `SELECT p.proname, p.provolatile
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname IN ('mehfil_edit_key_matches', 'verify_edit_key', 'get_editable_plan',
                           'save_plan_version', 'list_plan_versions', 'regenerate_share_key')
       ORDER BY 1`
    )
    expect(rows).toHaveLength(6)
    expect(rows.filter((r) => r.provolatile !== 'v')).toEqual([])
  })

  it('no function that calls the helper is STABLE or IMMUTABLE', async () => {
    const { rows } = await db.query<{ proname: string }>(
      `SELECT p.proname
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.provolatile <> 'v'
         AND p.prosrc LIKE '%mehfil_edit_key_matches%'`
    )
    expect(rows).toEqual([])
  })

  it('keeps the helper private and the five RPCs on anon + service_role only', async () => {
    const rpcs = [
      'verify_edit_key',
      'get_editable_plan',
      'save_plan_version',
      'list_plan_versions',
      'regenerate_share_key',
    ]
    const { rows } = await db.query<{ proname: string; role: string; allowed: boolean }>(
      `SELECT p.proname, r.role, has_function_privilege(r.role, p.oid, 'EXECUTE') AS allowed
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
            (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role)
       WHERE n.nspname = 'public' AND p.proname = ANY($1)
       ORDER BY 1, 2`,
      [rpcs]
    )
    for (const name of rpcs) {
      const byRole = Object.fromEntries(
        rows.filter((r) => r.proname === name).map((r) => [r.role, r.allowed])
      )
      expect(byRole, name).toEqual({ anon: true, authenticated: false, service_role: true })
    }

    const helper = await callRpc(db, 'mehfil_edit_key_matches', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_edit_key: WRONG_KEY,
    })
    expect(helper.error?.message).toMatch(/permission denied/i)

    const publicAcl = await db.query<{ proname: string }>(
      `SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = ANY($1) AND p.proacl::text ~ '(^\\{|,)=X/'`,
      [[...rpcs, 'mehfil_edit_key_matches']]
    )
    expect(publicAcl.rows).toEqual([])
  })
})
