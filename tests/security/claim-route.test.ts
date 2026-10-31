// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PGlite } from '@electric-sql/pglite'
import { POST } from '@/app/api/plan/[id]/claim/route'
import { CloudPlans } from '@/lib/storage/cloud-plans'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { resetRateLimitStore } from '@/lib/security/rate-limit'
import { createMigratedDatabase, createPgliteRpcClient } from '../helpers/pglite'

let supabase: unknown = null
vi.mock('@/lib/supabase/server', () => ({ getServerRpc: vi.fn(() => supabase) }))

let db: PGlite
let created: Awaited<ReturnType<CloudPlans['createEvent']>>
beforeAll(async () => {
  db = await createMigratedDatabase()
  const client = createPgliteRpcClient(db)
  supabase = client
  created = await new CloudPlans(client).createEvent(
    instantiatePlanFromBrief({
      title: 'Claim test',
      eventType: 'birthday',
      eventDate: '2027-05-05',
      city: 'Pune',
      guestCount: 60,
      totalBudgetPaise: 50_000_000,
      protectedCategory: 'catering',
    }),
    'Initial plan'
  )
}, 60_000)
afterAll(async () => {
  await db.close()
})
beforeEach(() => resetRateLimitStore())
afterEach(() => vi.unstubAllEnvs())

const claim = (planId: string, key: unknown) =>
  POST(
    new NextRequest(`http://localhost/api/plan/${planId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ key }),
      headers: { 'content-type': 'application/json', 'x-real-ip': '198.51.100.30' },
    }),
    { params: Promise.resolve({ id: planId }) }
  )

describe('POST /api/plan/[id]/claim against the real database (S4)', () => {
  it('accepts the real edit key and sets no cookie', async () => {
    const res = await claim(created.eventId, created.editKey)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ authorized: true })
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('answers wrong keys and unknown plans identically', async () => {
    const wrongKey = await claim(created.eventId, 'f'.repeat(64))
    const unknownPlan = await claim('00000000-0000-4000-8000-000000000000', created.editKey)
    expect(wrongKey.status).toBe(401)
    expect(unknownPlan.status).toBe(401)
    expect(await wrongKey.json()).toEqual(await unknownPlan.json())
  })

  it('does not accept the share token, or a stored hash, as an edit key', async () => {
    expect((await claim(created.eventId, created.shareKey)).status).toBe(401)
  })

  it('treats ids that are not UUIDs as unknown plans', async () => {
    expect((await claim('wedding-local-plan', created.editKey)).status).toBe(404)
  })

  it('rejects a missing or non-string key with 400', async () => {
    expect((await claim(created.eventId, undefined)).status).toBe(400)
    expect((await claim(created.eventId, 12345)).status).toBe(400)
  })

  it('fails closed with 503 in production when no database is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const previous = supabase
    supabase = null
    try {
      const res = await claim(created.eventId, created.editKey)
      expect(res.status).toBe(503)
      expect(res.headers.get('set-cookie')).toBeNull()
    } finally {
      supabase = previous
    }
  })

  it('reports a database outage as 502, never as authorized', async () => {
    const previous = supabase
    supabase = { rpc: async () => ({ data: null, error: { message: 'connection refused' } }) }
    try {
      const res = await claim(created.eventId, created.editKey)
      expect(res.status).toBe(502)
      expect(JSON.stringify(await res.json())).not.toContain('connection refused')
    } finally {
      supabase = previous
    }
  })
})
