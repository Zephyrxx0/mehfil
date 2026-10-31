// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import type { PGlite } from '@electric-sql/pglite'
import { asRole, callRpc, createMigratedDatabase } from '../helpers/pglite'
import { createEventArgs, samplePlan, type CreatedEvent } from './fixtures'

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

let db: PGlite
beforeAll(async () => {
  db = await createMigratedDatabase()
}, 60_000)
afterAll(async () => {
  await db.close()
})

async function newEvent(plan = samplePlan()): Promise<CreatedEvent> {
  const { data, error } = await callRpc<CreatedEvent>(db, 'create_event', createEventArgs(plan))
  expect(error).toBeNull()
  return data as CreatedEvent
}

describe('S1: the browser (anon role) cannot touch the tables directly', () => {
  it.each(['events', 'plan_versions', 'change_records'])(
    'denies all access to %s',
    async (table) => {
      const read = asRole(db, 'anon', () => db.query(`SELECT * FROM public.${table}`))
      await expect(read).rejects.toThrow(/permission denied/i)

      const write = asRole(db, 'anon', () => db.query(`DELETE FROM public.${table}`))
      await expect(write).rejects.toThrow(/permission denied/i)
    }
  )

  it('also denies the authenticated role', async () => {
    const read = asRole(db, 'authenticated', () => db.query('SELECT * FROM public.events'))
    await expect(read).rejects.toThrow(/permission denied/i)
  })

  it('keeps row-level security on with no policies (deny by default)', async () => {
    const tables = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT relname, relrowsecurity FROM pg_class
       WHERE relname IN ('events','plan_versions','change_records') AND relkind = 'r'`
    )
    expect(tables.rows).toHaveLength(3)
    expect(tables.rows.every((t) => t.relrowsecurity)).toBe(true)
    const policies = await db.query(`SELECT 1 FROM pg_policies WHERE schemaname = 'public'`)
    expect(policies.rows).toHaveLength(0)
  })

  it('every SECURITY DEFINER function pins search_path and is closed to PUBLIC', async () => {
    const fns = await db.query<{ proname: string; proconfig: string[] | null; acl: string | null }>(
      `SELECT p.proname, p.proconfig, p.proacl::text AS acl
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.prosecdef`
    )
    expect(fns.rows.length).toBeGreaterThanOrEqual(8)
    for (const fn of fns.rows) {
      expect(fn.proconfig?.some((c) => c.startsWith('search_path='))).toBe(true)
      // An ACL entry with an empty grantee (`=X/...`) means PUBLIC can execute.
      expect(fn.acl ?? '').not.toMatch(/(^\{|,)=X\//)
    }
  })
})

describe('schema invariants', () => {
  it('stores money as BIGINT paise and indexes both capability hashes', async () => {
    const column = await db.query<{ data_type: string }>(
      `SELECT data_type FROM information_schema.columns
       WHERE table_name = 'events' AND column_name = 'total_budget_paise'`
    )
    expect(column.rows[0].data_type).toBe('bigint')

    const indexes = await db.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes WHERE tablename = 'events'`
    )
    const defs = indexes.rows.map((r) => r.indexdef).join('\n')
    expect(defs).toContain('(edit_key_hash)')
    expect(defs).toContain('(share_key_hash)')
  })

  it('rejects a negative budget and a non-positive guest count', async () => {
    const negative = await callRpc(db, 'create_event', {
      ...createEventArgs(),
      p_total_budget_paise: -1,
    })
    expect(negative.error).not.toBeNull()
    const noGuests = await callRpc(db, 'create_event', { ...createEventArgs(), p_guest_count: 0 })
    expect(noGuests.error).not.toBeNull()
  })
})

describe('create_event', () => {
  it('returns distinct 256-bit tokens once and stores only their SHA-256 hashes', async () => {
    const created = await newEvent()
    expect(created.edit_key).toMatch(/^[0-9a-f]{64}$/)
    expect(created.share_key).toMatch(/^[0-9a-f]{64}$/)
    expect(created.edit_key).not.toBe(created.share_key)
    expect(created.event_id).toMatch(/^[0-9a-f-]{36}$/)

    const stored = await db.query<{ edit_key_hash: string; share_key_hash: string }>(
      'SELECT edit_key_hash, share_key_hash FROM public.events WHERE id = $1',
      [created.event_id]
    )
    expect(stored.rows[0].edit_key_hash).toBe(sha256(created.edit_key))
    expect(stored.rows[0].share_key_hash).toBe(sha256(created.share_key))
    expect(JSON.stringify(stored.rows)).not.toContain(created.edit_key)
  })

  it('creates version 1 with the full snapshot and an audit row', async () => {
    const created = await newEvent()
    const versions = await db.query<{
      version_number: number
      snapshot: { brief: { city: string } }
    }>('SELECT version_number, snapshot FROM public.plan_versions WHERE event_id = $1', [
      created.event_id,
    ])
    expect(versions.rows).toHaveLength(1)
    expect(versions.rows[0].version_number).toBe(1)
    expect(versions.rows[0].snapshot.brief.city).toBe('Jaipur')
    const audit = await db.query('SELECT 1 FROM public.change_records WHERE plan_version_id = $1', [
      created.version_id,
    ])
    expect(audit.rows).toHaveLength(1)
  })

  it('rejects malformed or oversized input', async () => {
    const noLines = await callRpc(db, 'create_event', {
      ...createEventArgs(),
      p_snapshot: { brief: {}, lines: 'nope' },
    })
    expect(noLines.error?.message).toMatch(/invalid plan snapshot/)

    const huge = await callRpc(db, 'create_event', {
      ...createEventArgs(),
      p_snapshot: { ...samplePlan(), padding: 'x'.repeat(1_100_000) },
    })
    expect(huge.error?.message).toMatch(/too large/)

    const blankTitle = await callRpc(db, 'create_event', { ...createEventArgs(), p_title: '   ' })
    expect(blankTitle.error?.message).toMatch(/invalid event details/)

    const badType = await callRpc(db, 'create_event', {
      ...createEventArgs(),
      p_event_type: 'funeral',
    })
    expect(badType.error).not.toBeNull()
  })
})

describe('verify_edit_key and get_editable_plan', () => {
  it('accepts the right key and rejects wrong, empty and cross-event keys identically', async () => {
    const a = await newEvent()
    const b = await newEvent()
    const verify = async (id: string, key: string | null) =>
      (await callRpc<boolean>(db, 'verify_edit_key', { p_event_id: id, p_edit_key: key })).data

    expect(await verify(a.event_id, a.edit_key)).toBe(true)
    expect(await verify(a.event_id, b.edit_key)).toBe(false)
    expect(await verify(a.event_id, a.share_key)).toBe(false)
    expect(await verify(a.event_id, 'short')).toBe(false)
    expect(await verify(a.event_id, null)).toBe(false)
    expect(await verify('00000000-0000-0000-0000-000000000000', a.edit_key)).toBe(false)
  })

  it('does not accept a stored hash as a key', async () => {
    const created = await newEvent()
    const verified = await callRpc<boolean>(db, 'verify_edit_key', {
      p_event_id: created.event_id,
      p_edit_key: sha256(created.edit_key),
    })
    expect(verified.data).toBe(false)
  })

  it('returns the latest plan to the organizer and nothing to anyone else', async () => {
    const created = await newEvent()
    const ok = await callRpc<{ event: { id: string }; version: { version_number: number } }>(
      db,
      'get_editable_plan',
      { p_event_id: created.event_id, p_edit_key: created.edit_key }
    )
    expect(ok.data?.event.id).toBe(created.event_id)
    expect(ok.data?.version.version_number).toBe(1)
    expect(JSON.stringify(ok.data)).not.toContain('edit_key_hash')

    const wrong = await callRpc(db, 'get_editable_plan', {
      p_event_id: created.event_id,
      p_edit_key: 'f'.repeat(64),
    })
    expect(wrong.data).toBeNull()
    const unknown = await callRpc(db, 'get_editable_plan', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_edit_key: 'f'.repeat(64),
    })
    expect(unknown.data).toBeNull() // no oracle for "plan exists but key is wrong"
  })
})

describe('save_plan_version', () => {
  it('appends versions, links parents and updates the event summary', async () => {
    const created = await newEvent()
    const v2 = await callRpc<{ status: string; version_number: number; version_id: string }>(
      db,
      'save_plan_version',
      {
        p_event_id: created.event_id,
        p_edit_key: created.edit_key,
        p_parent_version_id: created.version_id,
        p_snapshot: samplePlan({
          brief: { ...samplePlan().brief, guestCount: 250, city: 'Udaipur' },
        }),
        p_reason: 'Scaled to 250',
        p_is_floor_protected: true,
      }
    )
    expect(v2.data).toMatchObject({ status: 'saved', version_number: 2 })

    const event = await db.query<{ guest_count: number; city: string }>(
      'SELECT guest_count, city FROM public.events WHERE id = $1',
      [created.event_id]
    )
    expect(event.rows[0]).toEqual({ guest_count: 250, city: 'Udaipur' })

    const history = await callRpc<
      Array<{ version_number: number; parent_version_id: string | null }>
    >(db, 'list_plan_versions', { p_event_id: created.event_id, p_edit_key: created.edit_key })
    expect(history.data?.map((v) => v.version_number)).toEqual([2, 1])
    expect(history.data?.[0].parent_version_id).toBe(created.version_id)
  })

  it('reports a stale parent as a conflict and returns the newest version, saving nothing', async () => {
    const created = await newEvent()
    const save = (parent: string, guests: number) =>
      callRpc<{
        status: string
        version_number: number
        snapshot?: { brief: { guestCount: number } }
      }>(db, 'save_plan_version', {
        p_event_id: created.event_id,
        p_edit_key: created.edit_key,
        p_parent_version_id: parent,
        p_snapshot: samplePlan({ brief: { ...samplePlan().brief, guestCount: guests } }),
        p_reason: `guests ${guests}`,
      })

    const deviceA = await save(created.version_id, 210)
    expect(deviceA.data?.status).toBe('saved')

    const deviceB = await save(created.version_id, 999) // still thinks v1 is the latest
    expect(deviceB.data?.status).toBe('conflict')
    expect(deviceB.data?.version_number).toBe(2)
    expect(deviceB.data?.snapshot?.brief.guestCount).toBe(210)

    const count = await db.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM public.plan_versions WHERE event_id = $1',
      [created.event_id]
    )
    expect(count.rows[0].n).toBe(2)
  })

  it('refuses a wrong key without writing anything', async () => {
    const created = await newEvent()
    const attempt = await callRpc<{ status: string }>(db, 'save_plan_version', {
      p_event_id: created.event_id,
      p_edit_key: created.share_key, // the family link must not grant edit rights
      p_parent_version_id: created.version_id,
      p_snapshot: samplePlan(),
      p_reason: 'sneaky edit',
    })
    expect(attempt.data?.status).toBe('unauthorized')
    const count = await db.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM public.plan_versions WHERE event_id = $1',
      [created.event_id]
    )
    expect(count.rows[0].n).toBe(1)
  })

  it('keeps versions immutable even for the table owner', async () => {
    const created = await newEvent()
    await expect(
      db.query("UPDATE public.plan_versions SET reason = 'rewritten' WHERE event_id = $1", [
        created.event_id,
      ])
    ).rejects.toThrow(/immutable/)
    await expect(
      db.query("UPDATE public.change_records SET explanation = 'rewritten'")
    ).rejects.toThrow(/immutable/)
  })

  it('enforces one version number per event at the database level', async () => {
    const created = await newEvent()
    await expect(
      db.query(
        `INSERT INTO public.plan_versions (event_id, version_number, reason, lines)
         VALUES ($1, 1, 'duplicate', '[]')`,
        [created.event_id]
      )
    ).rejects.toThrow(/uq_event_version|duplicate key/)
  })
})

describe('family share link', () => {
  it('opens the shared plan with the plain share token and exposes no secrets', async () => {
    const created = await newEvent()
    const shared = await callRpc<Array<Record<string, unknown>>>(db, 'get_shared_plan', {
      p_share_key: created.share_key,
    })
    expect(shared.data).toHaveLength(1)
    expect(shared.data?.[0]).toMatchObject({ id: created.event_id, city: 'Jaipur' })
    expect(Object.keys(shared.data![0])).not.toContain('edit_key_hash')
    expect(JSON.stringify(shared.data)).not.toContain(created.edit_key)
  })

  it('does not open with the edit key, a hash, or a bad token', async () => {
    const created = await newEvent()
    for (const token of [created.edit_key, sha256(created.share_key), 'x', '']) {
      const shared = await callRpc<unknown[]>(db, 'get_shared_plan', { p_share_key: token })
      expect(shared.data).toHaveLength(0)
    }
  })

  it('regenerating revokes the old link immediately and the new one works', async () => {
    const created = await newEvent()
    const regenerated = await callRpc<{ share_key: string }>(db, 'regenerate_share_key', {
      p_event_id: created.event_id,
      p_edit_key: created.edit_key,
    })
    const fresh = regenerated.data!.share_key
    expect(fresh).toMatch(/^[0-9a-f]{64}$/)
    expect(fresh).not.toBe(created.share_key)

    const oldLink = await callRpc<unknown[]>(db, 'get_shared_plan', {
      p_share_key: created.share_key,
    })
    expect(oldLink.data).toHaveLength(0)
    const newLink = await callRpc<unknown[]>(db, 'get_shared_plan', { p_share_key: fresh })
    expect(newLink.data).toHaveLength(1)
  })

  it('only the edit key can regenerate the link', async () => {
    const created = await newEvent()
    const attempt = await callRpc(db, 'regenerate_share_key', {
      p_event_id: created.event_id,
      p_edit_key: created.share_key,
    })
    expect(attempt.data).toBeNull()
    const stillWorks = await callRpc<unknown[]>(db, 'get_shared_plan', {
      p_share_key: created.share_key,
    })
    expect(stillWorks.data).toHaveLength(1)
  })

  it('does not show archived events', async () => {
    const created = await newEvent()
    await db.query("UPDATE public.events SET status = 'archived' WHERE id = $1", [created.event_id])
    const shared = await callRpc<unknown[]>(db, 'get_shared_plan', {
      p_share_key: created.share_key,
    })
    expect(shared.data).toHaveLength(0)
    const verified = await callRpc<boolean>(db, 'verify_edit_key', {
      p_event_id: created.event_id,
      p_edit_key: created.edit_key,
    })
    expect(verified.data).toBe(false)
  })
})
