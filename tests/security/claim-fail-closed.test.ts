import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/plan/[id]/claim/route'
import { POST as regenerate } from '@/app/api/plan/[id]/regenerate-share/route'
import { hashCapabilityToken } from '@/lib/engine/crypto'
import { resetRateLimitStore } from '@/lib/security/rate-limit'
import { createEditSession } from '@/lib/security/edit-session'

const cookieJar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: (name: string, value: string) => cookieJar.set(name, value),
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
  })),
}))

let supabase: unknown = null
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: vi.fn(async () => supabase) }))

const PLAN = 'plan-claim-1'
const EDIT_KEY = 'e'.repeat(64)

function fakeSupabase(editKeyHash: string) {
  const update = vi.fn(() => ({ eq: async () => ({ error: null }) }))
  return {
    update,
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: PLAN, edit_key_hash: editKeyHash }, error: null }),
        }),
      }),
      update,
    }),
  }
}

const claim = (key?: string) =>
  POST(
    new NextRequest(`http://localhost/api/plan/${PLAN}/claim`, {
      method: 'POST',
      body: JSON.stringify({ key }),
      headers: { 'content-type': 'application/json', 'x-real-ip': '198.51.100.20' },
    }),
    { params: Promise.resolve({ id: PLAN }) }
  )

const regen = (key?: string) =>
  regenerate(
    new NextRequest(`http://localhost/api/plan/${PLAN}/regenerate-share`, {
      method: 'POST',
      body: JSON.stringify(key ? { key } : {}),
      headers: { 'content-type': 'application/json', 'x-real-ip': '198.51.100.21' },
    }),
    { params: Promise.resolve({ id: PLAN }) }
  )

describe('claim and regenerate routes fail closed (S4)', () => {
  beforeEach(() => {
    cookieJar.clear()
    supabase = null
    resetRateLimitStore()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('production without Supabase returns 503 and sets no cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('EDIT_SESSION_SECRET', 'x'.repeat(40))
    const res = await claim('anything')
    expect(res.status).toBe(503)
    expect(cookieJar.size).toBe(0)
  })

  it('production without a session secret returns 503 even with Supabase', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    supabase = fakeSupabase(await hashCapabilityToken(EDIT_KEY))
    const res = await claim(EDIT_KEY)
    expect(res.status).toBe(503)
    expect(cookieJar.size).toBe(0)
  })

  it('rejects a wrong key with 401 and sets no cookie', async () => {
    supabase = fakeSupabase(await hashCapabilityToken(EDIT_KEY))
    const res = await claim('wrong-key')
    expect(res.status).toBe(401)
    expect(cookieJar.size).toBe(0)
  })

  it('a correct key sets a signed session, never the stored hash', async () => {
    const storedHash = await hashCapabilityToken(EDIT_KEY)
    supabase = fakeSupabase(storedHash)
    const res = await claim(EDIT_KEY)
    expect(res.status).toBe(200)
    const cookie = cookieJar.get(`mehfil_edit_${PLAN}`)
    expect(cookie).toMatch(/^v1\.\d+\./)
    expect(cookie).not.toContain(storedHash)
  })

  it('regenerate-share rejects the stored hash used as a cookie (the old credential)', async () => {
    const storedHash = await hashCapabilityToken(EDIT_KEY)
    supabase = fakeSupabase(storedHash)
    cookieJar.set(`mehfil_edit_${PLAN}`, storedHash)
    const res = await regen()
    expect(res.status).toBe(401)
  })

  it('regenerate-share accepts a valid signed session', async () => {
    supabase = fakeSupabase(await hashCapabilityToken(EDIT_KEY))
    cookieJar.set(`mehfil_edit_${PLAN}`, await createEditSession(PLAN))
    const res = await regen()
    expect(res.status).toBe(200)
    expect((await res.json()).shareToken).toMatch(/^[0-9a-f]{64}$/)
  })

  it('regenerate-share in production without Supabase returns 503', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('EDIT_SESSION_SECRET', 'x'.repeat(40))
    cookieJar.set(`mehfil_edit_${PLAN}`, await createEditSession(PLAN))
    expect((await regen()).status).toBe(503)
  })
})
