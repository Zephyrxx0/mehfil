// A stand-in for Supabase's REST layer, used only by the end-to-end tests.
//
// It applies the project's real migrations to an in-process Postgres (PGlite) and serves the
// `/rest/v1/rpc/<function>` endpoints the app calls, running each one as the `anon` role exactly
// (using the role that matches the key in the request) as PostgREST would. So the tests exercise the real SQL, grants and row-level security, with no
// Supabase account or Docker needed.
import http from 'node:http'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

/** Functions declared `RETURNS TABLE`: PostgREST answers with an array of row objects. */
const TABLE_FUNCTIONS = new Set(['get_shared_plan'])

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
}

/**
 * Starts the stand-in on `port` (0 picks a free one). PostgREST picks the database role from the
 * key in the request. The real project signs JWTs; this stand-in just compares the bearer token
 * with `serviceKey`. Resolves once listening, with a `close()` that also frees the database.
 */
export async function startLocalSupabase({
  port = Number(process.env.LOCAL_SUPABASE_PORT ?? 54329),
  serviceKey = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? '',
  migrations = join(process.cwd(), 'supabase', 'migrations'),
} = {}) {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await db.exec(`
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
  CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;`)
  for (const file of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(migrations, file), 'utf8'))
  }

  let queue = Promise.resolve() // PGlite is single-connection: run requests one at a time

  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors)
      return res.end()
    }
    const match = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(req.url ?? '')
    if (req.url === '/health') {
      res.writeHead(200, cors)
      return res.end('ok')
    }
    // Test-only peek at the counter table, so a test can prove where the counts really live.
    if (req.url?.startsWith('/__counters') && req.method === 'GET') {
      const bucket = new URL(req.url, 'http://x').searchParams.get('prefix') ?? ''
      queue = queue.then(async () => {
        const out = await db.query(
          'SELECT count(*)::int AS n FROM public.rate_limit_hits WHERE bucket LIKE $1',
          [`${bucket}%`]
        )
        res.writeHead(200, { ...cors, 'content-type': 'application/json' })
        res.end(JSON.stringify(out.rows[0]))
      })
      return
    }
    if (!match || req.method !== 'POST') {
      res.writeHead(404, cors)
      return res.end('{}')
    }
    const bearer = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1] ?? ''
    const role = serviceKey && bearer === serviceKey ? 'service_role' : 'anon'
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      queue = queue.then(async () => {
        const fn = match[1]
        try {
          // Parsed inside the try so a malformed body is a 400, not a crashed server.
          const entries = Object.entries(body ? JSON.parse(body) : {})
          const call = `public.${fn}(${entries.map(([k], i) => `${k} => $${i + 1}`).join(', ')})`
          const values = entries.map(([, v]) =>
            v !== null && typeof v === 'object' ? JSON.stringify(v) : v
          )
          const sql = TABLE_FUNCTIONS.has(fn)
            ? `SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) AS data FROM ${call} t`
            : `SELECT to_jsonb(${call}) AS data`
          await db.exec(`SET ROLE ${role}`)
          const out = await db.query(sql, values)
          res.writeHead(200, { ...cors, 'content-type': 'application/json' })
          res.end(JSON.stringify(out.rows[0]?.data ?? null))
        } catch (err) {
          res.writeHead(400, { ...cors, 'content-type': 'application/json' })
          res.end(JSON.stringify({ message: String(err.message), code: err.code }))
        } finally {
          await db.exec('RESET ROLE')
        }
      })
    })
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, resolve)
  })
  const address = server.address()
  return {
    port: typeof address === 'object' && address ? address.port : port,
    async close() {
      await new Promise((resolve) => {
        server.close(resolve)
        server.closeAllConnections()
      })
      await queue.catch(() => {})
      await db.close()
    },
  }
}

// Run directly (`node e2e/support/local-supabase.mjs`, as playwright.config.ts does): serve until killed.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { port } = await startLocalSupabase()
  process.stdout.write(`local supabase ready on :${port}\n`)
}
