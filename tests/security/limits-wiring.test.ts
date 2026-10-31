// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getServiceRpc } from '@/lib/supabase/server'
import { getLimits, memoryBackend, resetLimitsForTests } from '@/lib/security/shared-limits'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { resetModelBudget, tryConsumeModelCall } from '@/lib/security/model-budget'
import { resetRateLimitStore } from '@/lib/security/memory-limits'

const SERVICE_KEY = 'service-role-key-' + 'x'.repeat(40)

function configure(env: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(name, '')
    else vi.stubEnv(name, value)
  }
}

beforeEach(() => {
  resetRateLimitStore()
  resetModelBudget()
  resetLimitsForTests()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('which counters are used', () => {
  it('uses in-process counters when there is no service key (local mode)', () => {
    configure({ NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' })
    expect(getServiceRpc()).toBeNull()
    expect(getLimits()).toBe(memoryBackend)
  })

  it('stays in-process when only the public settings are present: the service key is what turns sharing on', () => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })
    expect(getServiceRpc()).toBeNull()
    expect(getLimits()).toBe(memoryBackend)
  })

  it('ignores the placeholder text from .env.example', () => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key-here',
    })
    expect(getServiceRpc()).toBeNull()
  })

  it('switches to the shared counters when the service key and project are set', () => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    })
    expect(getServiceRpc()).not.toBeNull()
    expect(getLimits()).not.toBe(memoryBackend)
  })

  it('reuses one client and one backend, so the failure cool-down survives between requests', () => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    })
    expect(getServiceRpc()).toBe(getServiceRpc())
    expect(getLimits()).toBe(getLimits())
  })
})

describe('end to end through the route helpers, with the database unreachable', () => {
  beforeEach(() => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      TEST_RATE_LIMIT: 'true',
      MODEL_DAILY_CAP: '2',
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )
  })

  it('the rate limit still holds (per instance) when the database cannot be reached', async () => {
    const request = new Request('http://localhost', { headers: { 'x-real-ip': '198.51.100.77' } })
    const statuses = []
    for (let i = 0; i < 4; i++)
      statuses.push((await enforceRateLimit(request, 'down', 2, 60_000))?.status)
    expect(statuses).toEqual([undefined, undefined, 429, 429])
  })

  it('the daily model cap still holds when the database cannot be reached', async () => {
    const taken = []
    for (let i = 0; i < 4; i++) taken.push(await tryConsumeModelCall())
    expect(taken).toEqual([true, true, false, false])
  })
})

describe('what is sent to the database', () => {
  it('stores only a keyed hash of the client address, never the address itself', async () => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      TEST_RATE_LIMIT: 'true',
    })
    const sent: Array<{ url: string; body: string; auth: string }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        sent.push({
          url,
          body: String(init.body),
          auth: (init.headers as Record<string, string>).Authorization,
        })
        return new Response(
          JSON.stringify({ allowed: true, remaining: 1, retry_after_seconds: 0 }),
          {
            status: 200,
          }
        )
      })
    )

    await enforceRateLimit(
      new Request('http://localhost', { headers: { 'x-real-ip': '203.0.113.42' } }),
      'claim-plan',
      5,
      60_000
    )

    expect(sent).toHaveLength(1)
    expect(sent[0].url).toBe('https://abc.supabase.co/rest/v1/rpc/consume_rate_limit')
    expect(sent[0].body).not.toContain('203.0.113.42')
    const { p_bucket } = JSON.parse(sent[0].body)
    expect(p_bucket).toMatch(/^claim-plan:[0-9a-f]{32}$/)
    // The service key goes in the header only, never in the body or the bucket name.
    expect(sent[0].auth).toBe(`Bearer ${SERVICE_KEY}`)
    expect(sent[0].body).not.toContain(SERVICE_KEY)
  })

  it('maps the same client to the same bucket and different clients to different ones', async () => {
    configure({
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key-123',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      TEST_RATE_LIMIT: 'true',
    })
    const buckets: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        buckets.push(JSON.parse(String(init.body)).p_bucket)
        return new Response(JSON.stringify({ allowed: true, remaining: 1, retry_after_seconds: 0 }))
      })
    )
    const from = (ip: string) => new Request('http://localhost', { headers: { 'x-real-ip': ip } })
    await enforceRateLimit(from('198.51.100.1'), 'r', 5, 60_000)
    await enforceRateLimit(from('198.51.100.1'), 'r', 5, 60_000)
    await enforceRateLimit(from('198.51.100.2'), 'r', 5, 60_000)
    expect(buckets[0]).toBe(buckets[1])
    expect(buckets[0]).not.toBe(buckets[2])
  })
})

describe('the service key never reaches the browser', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })

  it('is read only by server-side modules, and is never a NEXT_PUBLIC_ variable', () => {
    const sources = walk(join(process.cwd(), 'src')).filter((f) => /\.(ts|tsx)$/.test(f))
    const readers = sources
      .filter((f) => readFileSync(f, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'))
      .map((f) => f.replace(`${process.cwd()}/`, ''))
      .sort()
    expect(readers).toEqual(['src/lib/security/rate-limit.ts', 'src/lib/supabase/server.ts'])

    for (const file of sources) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/NEXT_PUBLIC_[A-Z_]*SERVICE/)
    }
  })

  it('no client component imports the modules that read it', () => {
    const offenders = walk(join(process.cwd(), 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /^['"]use client['"]/.test(readFileSync(f, 'utf8').trimStart()))
      .filter((f) =>
        /from '@\/lib\/(security\/(rate-limit|shared-limits|model-budget)|supabase\/server)'/.test(
          readFileSync(f, 'utf8')
        )
      )
    expect(offenders).toEqual([])
  })
})
