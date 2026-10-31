import { expect, test, type Browser, type Page } from '@playwright/test'

/**
 * The audit's headline finding (S1): cloud save and share links did not work across devices.
 * Each "device" here is its own browser context with its own storage, so nothing leaks between
 * them except what the database really returns.
 */

const guestCount = (page: Page) =>
  page
    .locator('dd')
    .filter({ has: page.getByRole('button', { name: 'Add 10 guests' }) })
    .locator('span')
    .first()

async function openShareDialog(page: Page) {
  await page.getByRole('button', { name: /Share & Save/i }).click()
  return page.getByRole('dialog')
}

async function readLinks(page: Page) {
  const dialog = await openShareDialog(page)
  const editUrl = await dialog.locator('#edit-url').inputValue()
  await dialog.getByRole('tab', { name: /Family Share Link/i }).click()
  const shareUrl = await dialog.locator('#share-url').inputValue()
  await page.keyboard.press('Escape')
  return { editUrl, shareUrl }
}

async function newDevice(browser: Browser) {
  const context = await browser.newContext()
  return { context, page: await context.newPage() }
}

test.describe('cloud save and sharing across devices', () => {
  test('a plan made on one device opens, edits and shares on others', async ({ browser }) => {
    // --- Device A: create a plan and change it
    const a = await newDevice(browser)
    await a.page.goto('/new?starter=wedding')
    await a.page.waitForURL(/\/plan\/[0-9a-f-]{36}\/budget/, { timeout: 30_000 })
    const planPath = new URL(a.page.url()).pathname
    expect(planPath).toMatch(/^\/plan\/[0-9a-f-]{36}\/budget$/) // a database id, not a local one

    await expect(guestCount(a.page)).toHaveText('300')
    await a.page.getByRole('button', { name: 'Add 10 guests' }).click()
    await expect(guestCount(a.page)).toHaveText('310')
    await expect(a.page.getByTestId('sync-status-badge')).toContainText('Saved to Cloud', {
      timeout: 15_000,
    })

    const { editUrl, shareUrl } = await readLinks(a.page)
    expect(editUrl).toContain('?key=')
    expect(shareUrl).toMatch(/\/share\/[0-9a-f]{64}$/)
    expect(shareUrl).not.toContain('share-token-preview') // S2: no placeholder link

    // --- Device B: family opens only the share link
    const b = await newDevice(browser)
    await b.page.goto(shareUrl)
    await expect(b.page.getByRole('heading', { level: 1 })).toContainText('Delhi Grand Wedding')
    await expect(b.page.getByText(/expired/i)).toHaveCount(0)
    const familyHtml = await b.page.content()
    expect(familyHtml).not.toContain(new URL(editUrl).searchParams.get('key')!) // no edit key leaks

    // --- Device C: a co-organizer opens only the edit link
    const c = await newDevice(browser)
    await c.page.goto(editUrl)
    // The secret must leave the address bar once the server has accepted it.
    await expect.poll(() => c.page.url(), { timeout: 30_000 }).not.toContain('key=')
    expect(c.page.url()).toMatch(/\/plan\/[0-9a-f-]{36}(\/budget)?$/)
    await expect(c.page.getByTestId('sync-status-badge')).toContainText('Saved to Cloud', {
      timeout: 15_000,
    })
    await expect(guestCount(c.page)).toHaveText('310') // sees device A's change
    await c.page.getByRole('button', { name: 'Add 10 guests' }).click()
    await expect(guestCount(c.page)).toHaveText('320')
    await expect(c.page.getByTestId('sync-status-badge')).toContainText('Saved to Cloud', {
      timeout: 15_000,
    })

    // --- Device A reloads and sees device C's change
    await a.page.reload()
    await expect(guestCount(a.page)).toHaveText('320')

    // --- The history tab shows each saved version
    await a.page.getByRole('tab', { name: 'History' }).click()
    await expect(a.page.getByText(/Scaled guest count/).first()).toBeVisible()

    await Promise.all([a.context.close(), b.context.close(), c.context.close()])
  })

  test('replacing the family link revokes the old one at once', async ({ browser }) => {
    const a = await newDevice(browser)
    await a.page.goto('/new?starter=birthday')
    await a.page.waitForURL(/\/plan\/[0-9a-f-]{36}\/budget/, { timeout: 30_000 })
    const { shareUrl: oldLink } = await readLinks(a.page)

    const dialog = await openShareDialog(a.page)
    await dialog.getByRole('tab', { name: /Family Share Link/i }).click()
    await dialog.getByRole('button', { name: /Regenerate Link/i }).click()
    await a.page.getByRole('button', { name: /Invalidate & Regenerate/i }).click()
    await expect(dialog.locator('#share-url')).not.toHaveValue(oldLink)
    const newLink = await dialog.locator('#share-url').inputValue()

    const family = await newDevice(browser)
    await family.page.goto(oldLink)
    await expect(family.page.getByText(/expired/i).first()).toBeVisible()
    await family.page.goto(newLink)
    await expect(family.page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(family.page.getByText(/expired/i)).toHaveCount(0)

    await Promise.all([a.context.close(), family.context.close()])
  })

  test('a wrong edit key does not open the plan for editing', async ({ browser }) => {
    const a = await newDevice(browser)
    await a.page.goto('/new?starter=community')
    await a.page.waitForURL(/\/plan\/[0-9a-f-]{36}\/budget/, { timeout: 30_000 })
    const planId = new URL(a.page.url()).pathname.split('/')[2]

    const stranger = await newDevice(browser)
    await stranger.page.goto(`/plan/${planId}?key=${'f'.repeat(64)}`)
    await expect(stranger.page.getByText(/Celebration Plan Not Found/i)).toBeVisible({
      timeout: 30_000,
    })
    await expect(stranger.page.getByRole('button', { name: 'Add 10 guests' })).toHaveCount(0)

    await Promise.all([a.context.close(), stranger.context.close()])
  })

  test('the family view of a made-up token shows the expired page, not an error', async ({
    page,
  }) => {
    await page.goto(`/share/${'0'.repeat(64)}`)
    await expect(page.getByText(/expired/i).first()).toBeVisible()
  })
})

test.describe('browser security', () => {
  test('pages ship a nonce-based CSP and run without a single violation', async ({ page }) => {
    const problems: string[] = []
    page.on('console', (msg) => {
      if (/content security policy|refused to (load|execute|connect)/i.test(msg.text())) {
        problems.push(msg.text())
      }
    })
    page.on('pageerror', (err) => problems.push(String(err)))

    const response = await page.goto('/')
    const csp = response!.headers()['content-security-policy']
    expect(csp).toBeTruthy()
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'))!
    expect(scriptSrc).toMatch(/'nonce-[^']+'/)
    expect(scriptSrc).not.toContain('unsafe-inline')
    expect(scriptSrc).not.toContain('unsafe-eval')
    expect(csp).toContain('connect-src')
    expect(csp).toContain('http://localhost:54329') // exactly the configured project, no wildcard
    expect(csp).not.toContain('*.supabase.co')

    // Exercise hydration, a navigation and the plan workspace under that policy.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.goto('/new?starter=wedding')
    await page.waitForURL(/\/plan\//, { timeout: 30_000 })
    await page.getByRole('tab', { name: 'Timeline' }).click()
    await page.getByRole('tab', { name: 'Style' }).click()

    expect(problems).toEqual([])
  })

  test('the app contacts only itself and its own database, and its fonts are self-hosted', async ({
    page,
  }) => {
    const hosts = new Set<string>()
    page.on('request', (request) => hosts.add(new URL(request.url()).host))

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.goto('/new?starter=wedding')
    await page.waitForURL(/\/plan\//, { timeout: 30_000 })
    await page.waitForLoadState('networkidle')

    expect([...hosts].sort()).toEqual(['localhost:3940', 'localhost:54329'])
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
    })
    expect(loaded.length).toBeGreaterThan(0)
  })

  test('hardening headers are present', async ({ request }) => {
    const headers = (await request.get('/')).headers()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toMatch(/max-age=\d+/)
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  })

  test('the API refuses oversized and forged requests', async ({ request }) => {
    const tooBig = await request.post('/api/ai/quote-analyst', {
      headers: { 'content-type': 'application/json' },
      data: JSON.stringify({ rawText: 'x'.repeat(20), imageBase64: 'a'.repeat(5_000_000) }),
    })
    expect(tooBig.status()).toBe(413)

    // A forged x-vercel-ip must not buy a fresh rate-limit bucket.
    const statuses: number[] = []
    for (let i = 0; i < 18; i++) {
      const res = await request.post('/api/vibes/suggest', {
        headers: { 'x-vercel-ip': `203.0.113.${i}`, 'cf-connecting-ip': `198.51.100.${i}` },
        data: { description: 'candlelit courtyard' },
      })
      statuses.push(res.status())
    }
    expect(statuses).toContain(429)
    expect(statuses.indexOf(429)).toBeLessThanOrEqual(15)
  })
})
