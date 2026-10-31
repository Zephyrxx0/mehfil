// @vitest-environment node
// The Playwright suite talks to this helper instead of Supabase. These tests start it on a free
// port and call it over real HTTP, the way src/lib/supabase/rpc-client.ts does.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startLocalSupabase } from '../../e2e/support/local-supabase.mjs'
import { createEventArgs, samplePlan, type CreatedEvent } from '../db/fixtures'

const SERVICE_KEY = 'test-service-key'
const ANON_KEY = 'test-anon-key'

let server: { port: number; close: () => Promise<void> }
let base: string

beforeAll(async () => {
  server = await startLocalSupabase({ port: 0, serviceKey: SERVICE_KEY })
  base = `http://127.0.0.1:${server.port}`
}, 60_000)

afterAll(async () => {
  await server?.close()
})

async function rpc(fn: string, args: unknown, key = ANON_KEY) {
  const res = await fetch(`${base}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(args),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

describe('local Supabase stand-in', () => {
  it('binds the requested ephemeral port', () => {
    expect(server.port).toBeGreaterThan(0)
  })

  it('answers CORS preflight with 204 and the allow headers', async () => {
    const res = await fetch(`${base}/rest/v1/rpc/create_event`, { method: 'OPTIONS' })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
    expect(res.headers.get('access-control-allow-headers')).toBe('*')
    expect(res.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
  })

  it('answers /health with 200', async () => {
    const res = await fetch(`${base}/health`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('returns 404 for an unknown path', async () => {
    const res = await fetch(`${base}/nope`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({})
  })

  it('returns 404 for a non-POST request to an RPC route', async () => {
    const res = await fetch(`${base}/rest/v1/rpc/verify_edit_key`)
    expect(res.status).toBe(404)
  })

  it('returns 404 for an RPC path with characters outside [a-z_]', async () => {
    const res = await fetch(`${base}/rest/v1/rpc/Create-Event`, { method: 'POST', body: '{}' })
    expect(res.status).toBe(404)
  })

  it('round-trips create_event then verify_edit_key', async () => {
    const created = await rpc('create_event', createEventArgs(samplePlan()))
    expect(created.status).toBe(200)
    const event = created.body as CreatedEvent
    expect(event.event_id).toMatch(/^[0-9a-f-]{36}$/)
    expect(event.edit_key).toMatch(/^[0-9a-f]{64}$/)
    expect(event.version_number).toBe(1)

    const good = await rpc('verify_edit_key', {
      p_event_id: event.event_id,
      p_edit_key: event.edit_key,
    })
    expect(good).toEqual({ status: 200, body: true })

    const bad = await rpc('verify_edit_key', {
      p_event_id: event.event_id,
      p_edit_key: 'f'.repeat(64),
    })
    expect(bad).toEqual({ status: 200, body: false })
  })

  it('serves RETURNS TABLE functions as an array of rows', async () => {
    const created = (await rpc('create_event', createEventArgs(samplePlan()))).body as CreatedEvent
    const shared = await rpc('get_shared_plan', { p_share_key: created.share_key })
    expect(shared.status).toBe(200)
    expect(Array.isArray(shared.body)).toBe(true)

    const missing = await rpc('get_shared_plan', { p_share_key: 'unknown' })
    expect(missing).toEqual({ status: 200, body: [] })
  })

  it('treats a missing body as no arguments and reports the database error as 400', async () => {
    const res = await fetch(`${base}/rest/v1/rpc/create_event`, { method: 'POST' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toEqual(expect.any(String))
  })

  it('returns 400 for a function the database does not have', async () => {
    const res = await rpc('no_such_function', {})
    expect(res.status).toBe(400)
    expect(res.body.message).toEqual(expect.any(String))
  })

  it('returns 400 (not a crash) for a malformed JSON body, and keeps serving', async () => {
    const res = await fetch(`${base}/rest/v1/rpc/verify_edit_key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    })
    expect(res.status).toBe(400)
    expect((await res.json()).message).toEqual(expect.any(String))

    const health = await fetch(`${base}/health`)
    expect(health.status).toBe(200)
    const after = await rpc('verify_edit_key', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_edit_key: 'x',
    })
    expect(after.status).toBe(200)
  })

  it('runs as anon unless the bearer token is the service key', async () => {
    const args = { p_bucket: 'e2e-support', p_limit: 5, p_window_seconds: 60 }
    const asAnon = await rpc('consume_rate_limit', args)
    expect(asAnon.status).toBe(400)

    const asService = await rpc('consume_rate_limit', args, SERVICE_KEY)
    expect(asService.status).toBe(200)

    const peek = await fetch(`${base}/__counters?prefix=e2e-support`)
    expect(peek.status).toBe(200)
    expect((await peek.json()).n).toBeGreaterThanOrEqual(1)
  })

  it('serialises concurrent requests', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => rpc('create_event', createEventArgs(samplePlan())))
    )
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200])
    const ids = new Set(results.map((r) => (r.body as CreatedEvent).event_id))
    expect(ids.size).toBe(5)
  })
})
