import { expect, test } from '@playwright/test'

const SUPABASE = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

test.describe('live project', () => {
  test('the CSP names exactly this project, and the app contacts only itself and it', async ({
    page,
    baseURL,
  }) => {
    const problems: string[] = []
    page.on('console', (m) => {
      if (/content security policy|refused to (load|execute|connect)/i.test(m.text()))
        problems.push(m.text())
    })
    const hosts = new Set<string>()
    page.on('request', (r) => hosts.add(new URL(r.url()).host))

    const response = await page.goto('/')
    const csp = response!.headers()['content-security-policy']
    expect(csp).toContain(SUPABASE.origin)
    expect(csp).not.toContain('*.supabase.co')

    await page.goto('/new?starter=wedding')
    await page.waitForURL(/\/plan\/[0-9a-f-]{36}/, { timeout: 30_000 })
    await page.waitForLoadState('networkidle')

    expect([...hosts].sort()).toEqual([new URL(baseURL!).host, SUPABASE.host].sort())
    expect(problems).toEqual([])
  })

  test('the public key cannot touch the abuse counters or the tables', async ({ request }) => {
    const headers = { Authorization: `Bearer ${ANON}`, apikey: ANON }
    for (const [fn, data] of [
      ['consume_rate_limit', { p_bucket: 'claim-plan:victim', p_limit: 1, p_window_seconds: 60 }],
      ['consume_model_call', { p_cap: 1000 }],
    ] as const) {
      const res = await request.post(`${SUPABASE.origin}/rest/v1/rpc/${fn}`, { headers, data })
      expect([400, 401, 403]).toContain(res.status())
      expect(JSON.stringify(await res.json())).toMatch(/permission denied/i)
    }
    for (const table of ['events', 'plan_versions', 'rate_limit_hits', 'model_usage']) {
      const res = await request.get(`${SUPABASE.origin}/rest/v1/${table}?select=*`, { headers })
      expect(res.status(), table).toBeGreaterThanOrEqual(400)
    }
  })

  test('a client is limited across requests through the real counters', async ({ request }) => {
    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      const res = await request.post('/api/plan/00000000-0000-4000-8000-000000000000/claim', {
        headers: { 'x-real-ip': '203.0.113.201' },
        data: { key: 'f'.repeat(64) },
      })
      statuses.push(res.status())
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true)
    expect(statuses.slice(10)).toEqual([429, 429])
  })
})
