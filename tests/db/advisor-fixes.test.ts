// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { createMigratedDatabase } from '../helpers/pglite'

/**
 * Findings from the Supabase advisor (31 Oct 2026), pinned so they cannot come back:
 *  - the browser-facing functions are the only ones `anon` may run, and none is run by `authenticated`
 *  - no owner-based policies survive on the tables
 *  - the duplicate and unused indexes are gone
 */

let db: PGlite
beforeAll(async () => {
  db = await createMigratedDatabase()
}, 60_000)
afterAll(async () => {
  await db.close()
})

const APP_FUNCTIONS = [
  'create_event',
  'get_editable_plan',
  'get_shared_plan',
  'list_plan_versions',
  'regenerate_share_key',
  'save_plan_version',
  'verify_edit_key',
]

describe('function grants match what the app calls', () => {
  it('anon may execute exactly the functions the browser calls, and no others in public', async () => {
    const { rows } = await db.query<{ proname: string }>(`
      SELECT p.proname
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e') AND has_function_privilege('anon', p.oid, 'EXECUTE')
      ORDER BY 1`)
    expect(rows.map((r) => r.proname)).toEqual([...APP_FUNCTIONS].sort())
  })

  it('authenticated may execute no public function: the app never signs users in', async () => {
    const { rows } = await db.query<{ proname: string }>(`
      SELECT p.proname
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e') AND has_function_privilege('authenticated', p.oid, 'EXECUTE')`)
    expect(rows).toEqual([])
  })

  it('the abuse counters are reachable by service_role only', async () => {
    const { rows } = await db.query<{ role: string; proname: string }>(`
      SELECT r.role, p.proname
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
           (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role)
      WHERE n.nspname = 'public' AND p.proname IN ('consume_rate_limit', 'consume_model_call')
        AND has_function_privilege(r.role, p.oid, 'EXECUTE')
      ORDER BY 1, 2`)
    expect(rows).toEqual([
      { role: 'service_role', proname: 'consume_model_call' },
      { role: 'service_role', proname: 'consume_rate_limit' },
    ])
  })
})

describe('no leftover owner policies', () => {
  it('the tables have no policies at all', async () => {
    const { rows } = await db.query(
      `SELECT policyname FROM pg_policies WHERE schemaname = 'public'`
    )
    expect(rows).toEqual([])
  })
})

describe('indexes', () => {
  const indexNames = async () =>
    (
      await db.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
      )
    ).rows.map((r) => r.indexname)

  it('drops the index that duplicated the unique edit-key constraint, and the unused owner index', async () => {
    const names = await indexNames()
    expect(names).not.toContain('idx_events_edit_key_hash')
    expect(names).not.toContain('idx_events_owner_id')
  })

  it('keeps the unique constraint on each key hash, which is what lookups use', async () => {
    const { rows } = await db.query<{ n: string }>(`
      SELECT count(*)::text AS n FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'public.events'::regclass AND i.indisunique AND a.attname IN ('edit_key_hash','share_key_hash')`)
    expect(rows[0].n).toBe('2')
  })

  it('keeps the rate-limit time index the cleanup query relies on', async () => {
    expect(await indexNames()).toContain('idx_rate_limit_hits_time')
  })
})
