import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Real-browser accessibility checks against the production build and the local database, the
 * same setup as cloud-sharing.spec.ts. axe runs with the WCAG 2.0/2.1 A and AA rule sets; no rule
 * is disabled and nothing is excluded, so any violation is a real finding in the app.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const VIEWPORTS = [
  { name: 'desktop 1280x800', width: 1280, height: 800 },
  { name: 'phone 390x844', width: 390, height: 844 },
] as const

async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const summary = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(' ')),
  }))
  expect(summary, `axe violations on ${label}`).toEqual([])
}

async function createPlan(page: Page) {
  await page.goto('/new?starter=wedding')
  await page.waitForURL(/\/plan\/[0-9a-f-]{36}\/budget/, { timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Add 10 guests' })).toBeVisible()
}

for (const viewport of VIEWPORTS) {
  test.describe(`axe scan, ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test.beforeEach(async ({ page }) => {
      // Scan the settled page, not a frame in the middle of an entrance animation: contrast is
      // measured on whatever is painted at that moment.
      await page.emulateMedia({ reducedMotion: 'reduce' })
    })

    test('landing page', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page, `/ (${viewport.name})`)
    })

    test('new plan, step 1', async ({ page }) => {
      await page.goto('/new')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page, `/new (${viewport.name})`)
    })

    test('plan budget page', async ({ page }) => {
      await createPlan(page)
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page, `plan budget (${viewport.name})`)
    })

    test('plan timeline tab', async ({ page }) => {
      await createPlan(page)
      await page.getByRole('tab', { name: 'Timeline' }).click()
      await expect(page.getByRole('heading', { name: 'Backwards Milestone Roadmap' })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page, `plan timeline (${viewport.name})`)
    })

    test('quote intake sheet open on a row', async ({ page }) => {
      await createPlan(page)
      await page.getByRole('button', { name: 'Check Quote' }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page, `quote intake sheet (${viewport.name})`)
    })

    test('Share & Save dialog', async ({ page }) => {
      await createPlan(page)
      await page.getByRole('button', { name: /Share & Save/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page, `Share & Save dialog (${viewport.name})`)
    })
  })
}

test.describe('keyboard only', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('every Tab stop on the budget page shows a focus indicator', async ({ page }) => {
    await createPlan(page)
    await page.waitForLoadState('networkidle')

    let stops = 0
    const missing: string[] = []
    for (let stop = 0; stop < 40; stop++) {
      await page.keyboard.press('Tab')
      const focus = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const style = getComputedStyle(el)
        const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)
        return {
          id: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${label}"`,
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
        }
      })
      if (!focus) break // focus left the page content (back to the browser UI)
      stops++
      if (focus.outlineStyle === 'none' && focus.boxShadow === 'none') missing.push(focus.id)
    }

    expect(stops).toBeGreaterThan(5) // the page really was walked
    expect(missing, 'focused elements with no visible focus indicator').toEqual([])
  })

  test('Share & Save opens with Enter, closes with Escape and returns focus to its button', async ({
    page,
  }) => {
    await createPlan(page)
    await page.waitForLoadState('networkidle')

    const trigger = page.getByRole('button', { name: /Share & Save/i })
    await trigger.focus()
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('page metadata', () => {
  // A client-side tab switch used to drop every <head> tag (title, description, robots) because the
  // plan layout did not render its children. axe reports it as `document-title`; this pins the cause.
  test('the title and noindex tag survive switching tabs and going back', async ({ page }) => {
    await createPlan(page)
    const head = () =>
      page.evaluate(() => ({
        title: document.title,
        robots: document.querySelector('meta[name=robots]')?.getAttribute('content') ?? null,
      }))
    const expected = { title: 'Your celebration plan — Mehfil', robots: 'noindex, nofollow' }

    expect(await head()).toEqual(expected)
    for (const tab of ['Timeline', 'Ideas', 'Style']) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page).toHaveURL(new RegExp(`/${tab.toLowerCase()}$`))
      await expect.poll(head).toEqual(expected)
    }
    await page.goBack()
    await expect.poll(head).toEqual(expected)
  })
})
