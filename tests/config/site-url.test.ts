// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const read = (file: string) => readFileSync(join(process.cwd(), 'public', file), 'utf8')

describe('site address', () => {
  it('defaults to the production address and has no trailing slash', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    const { SITE_URL, SITE_HOST } = await import('@/lib/site')
    expect(SITE_URL).toBe('https://bookmymehfil.vercel.app')
    expect(SITE_HOST).toBe('bookmymehfil.vercel.app')
    vi.unstubAllEnvs()
  })

  it('honours NEXT_PUBLIC_APP_URL and strips trailing slashes', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://staging.example.test//')
    const { SITE_URL } = await import('@/lib/site')
    expect(SITE_URL).toBe('https://staging.example.test')
    vi.unstubAllEnvs()
  })

  it('the static robots, sitemap and llms files all name the production address', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    const { SITE_URL } = await import('@/lib/site')
    expect(read('robots.txt')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    for (const path of ['/', '/new', '/llms.txt', '/llms-full.txt']) {
      expect(read('sitemap.xml')).toContain(`<loc>${SITE_URL}${path}</loc>`)
    }
    expect(read('llms.txt')).toContain(`Homepage: ${SITE_URL}/`)
    expect(read('llms.txt')).toContain(`Plan Intake Wizard: ${SITE_URL}/new`)
    expect(read('llms.txt')).toContain(`Full Context: ${SITE_URL}/llms-full.txt`)
    vi.unstubAllEnvs()
  })
})
