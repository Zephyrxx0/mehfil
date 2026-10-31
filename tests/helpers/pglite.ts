import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations')

/** The parts of a Supabase project that the migrations rely on. */
const SUPABASE_STUBS = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
  -- Supabase grants new tables to the API roles by default; the migration must take them away.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
`

/**
 * Creates an in-process Postgres with every migration applied, the same way
 * `supabase db push` would, so tests exercise the real SQL and not a mock.
 */
export async function createMigratedDatabase(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await db.exec(SUPABASE_STUBS)

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
  for (const file of files) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
  }
  return db
}

/** Runs `work` with the privileges of a Supabase API role, then restores the superuser. */
export type ApiRole = 'anon' | 'authenticated' | 'service_role'

export async function asRole<T>(db: PGlite, role: ApiRole, work: () => Promise<T>): Promise<T> {
  await db.exec(`SET ROLE ${role}`)
  try {
    return await work()
  } finally {
    await db.exec('RESET ROLE')
  }
}

/** Functions declared `RETURNS TABLE`: PostgREST answers these with an array of row objects. */
const TABLE_FUNCTIONS = new Set(['get_shared_plan'])

/**
 * Calls an RPC the way PostgREST does: named arguments, as the `anon` role, and a JSON answer
 * (so dates arrive as 'YYYY-MM-DD' strings, not JS Date objects).
 */
export async function callRpc<T = unknown>(
  db: PGlite,
  name: string,
  args: Record<string, unknown>,
  role: ApiRole = 'anon'
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const entries = Object.entries(args)
  const placeholders = entries.map(([key], i) => `${key} => $${i + 1}`).join(', ')
  const values = entries.map(([, value]) =>
    value !== null && typeof value === 'object' ? JSON.stringify(value) : value
  )
  const call = `public.${name}(${placeholders})`
  const sql = TABLE_FUNCTIONS.has(name)
    ? `SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) AS data FROM ${call} t`
    : `SELECT to_jsonb(${call}) AS data`
  try {
    const result = await asRole(db, role, () => db.query<{ data: T }>(sql, values))
    return { data: (result.rows[0]?.data ?? null) as T | null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { data: null, error: { message, code: (err as { code?: string }).code } }
  }
}

/**
 * A Supabase-shaped client whose `rpc` runs against the in-process database as the `anon` role.
 * Lets the real TypeScript persistence code talk to the real SQL.
 */
export function createPgliteRpcClient(db: PGlite, role: ApiRole = 'anon') {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => callRpc(db, fn, args, role),
  } as unknown as import('@/lib/storage/cloud-plans').RpcClient
}
