import { describe, it, expect } from 'vitest'
import nextConfig from '@/../next.config'
import { buildContentSecurityPolicy, generateNonce } from '@/lib/security/csp'

describe('HTTP security headers (S9)', () => {
  it('sets static hardening headers on every route', async () => {
    const rules = await nextConfig.headers!()
    const globalRule = rules.find((rule) => rule.source === '/(.*)')
    expect(globalRule).toBeDefined()
    const headers = new Map(globalRule!.headers.map((h) => [h.key, h.value]))

    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('Permissions-Policy')).toContain('camera=()')
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(headers.get('Strict-Transport-Security')).toMatch(/max-age=\d{8,}/)
    // The CSP carries a nonce, so it is set per request by the middleware, not here.
    expect(headers.has('Content-Security-Policy')).toBe(false)
  })

  it('does not mark unfingerprinted public files as immutable (E1)', async () => {
    const rules = await nextConfig.headers!()
    for (const source of ['/swatches/:path*', '/hairline/:path*']) {
      const cache = rules.find((rule) => rule.source === source)?.headers[0].value
      expect(cache).toBeDefined()
      expect(cache).not.toContain('immutable')
      expect(cache).toContain('stale-while-revalidate')
    }
  })
})

describe('Content-Security-Policy builder (S9)', () => {
  const production = buildContentSecurityPolicy({ nonce: 'abc123', isDevelopment: false })
  const development = buildContentSecurityPolicy({ nonce: 'abc123', isDevelopment: true })
  const directive = (policy: string, name: string) =>
    policy.split('; ').find((d) => d.startsWith(`${name} `)) ?? ''

  it('allows only nonce-bearing scripts in production', () => {
    const scriptSrc = directive(production, 'script-src')
    expect(scriptSrc).toContain("'nonce-abc123'")
    expect(scriptSrc).toContain("'strict-dynamic'")
    expect(scriptSrc).not.toContain('unsafe-eval')
    expect(scriptSrc).not.toContain('unsafe-inline')
  })

  it('allows unsafe-eval only in development', () => {
    expect(directive(development, 'script-src')).toContain("'unsafe-eval'")
  })

  it('no longer allows any https image host or the Gemini and Google Fonts hosts', () => {
    expect(directive(production, 'img-src')).toBe("img-src 'self' data: blob:")
    expect(production).not.toContain('generativelanguage.googleapis.com')
    expect(production).not.toContain('fonts.googleapis.com')
    expect(production).not.toContain('fonts.gstatic.com')
  })

  it('keeps Supabase reachable and blocks framing, plugins and base-tag injection', () => {
    expect(directive(production, 'connect-src')).toContain('https://*.supabase.co')
    expect(production).toContain("frame-ancestors 'none'")
    expect(production).toContain("object-src 'none'")
    expect(production).toContain("base-uri 'self'")
    expect(production).toContain('upgrade-insecure-requests')
  })

  it('generates a different nonce for every request', () => {
    expect(new Set(Array.from({ length: 50 }, generateNonce)).size).toBe(50)
  })
})
