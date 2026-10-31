import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { config, middleware } from '@/middleware'

const get = (path = '/') => middleware(new NextRequest(`http://localhost${path}`))

describe('CSP middleware (S9)', () => {
  it('sets a Content-Security-Policy whose nonce matches the one forwarded to Next', () => {
    const res = get()
    const csp = res.headers.get('content-security-policy')!
    const nonce = /'nonce-([^']+)'/.exec(csp)![1]

    // Next reads the nonce from the *request* headers it is given, so they must carry it too.
    const forwarded = res.headers.get('x-middleware-request-content-security-policy')
    expect(forwarded).toBe(csp)
    expect(res.headers.get('x-middleware-request-x-nonce')).toBe(nonce)
  })

  it('uses a fresh nonce on every request', () => {
    const nonces = new Set(
      Array.from(
        { length: 20 },
        () => /'nonce-([^']+)'/.exec(get().headers.get('content-security-policy')!)![1]
      )
    )
    expect(nonces.size).toBe(20)
  })

  it('production responses carry the strict policy: no unsafe-eval, no unsafe-inline scripts', () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const csp = get().headers.get('content-security-policy')!
      const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'))!
      expect(scriptSrc).not.toContain('unsafe-eval')
      expect(scriptSrc).not.toContain('unsafe-inline')
      expect(scriptSrc).toContain("'strict-dynamic'")
      expect(csp).toContain('upgrade-insecure-requests')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('development responses allow eval for React Refresh, and only there', () => {
    vi.stubEnv('NODE_ENV', 'development')
    try {
      expect(get().headers.get('content-security-policy')).toContain("'unsafe-eval'")
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('does not run for API routes, build output or static files', () => {
    const source = (config.matcher as Array<{ source: string }>)[0].source
    const matches = (path: string) => new RegExp(`^${source}$`).test(path)
    expect(matches('/')).toBe(true)
    expect(matches('/plan/abc/budget')).toBe(true)
    expect(matches('/share/some-token')).toBe(true)
    expect(matches('/api/style-dna')).toBe(false)
    expect(matches('/_next/static/chunks/main.js')).toBe(false)
    expect(matches('/swatches/art-deco-bombay.svg')).toBe(false)
    expect(matches('/hairline/kernel.js')).toBe(false)
    expect(matches('/robots.txt')).toBe(false)
  })

  it('skips prefetches, which cannot use a nonce', () => {
    const missing = (config.matcher as Array<{ missing: Array<{ key: string }> }>)[0].missing
    expect(missing.map((m) => m.key)).toEqual(['next-router-prefetch', 'purpose'])
  })
})
