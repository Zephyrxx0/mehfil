import { describe, it, expect } from 'vitest'
import nextConfig from '@/../next.config'

describe('HTTP Security Headers Configuration (Task 2.1)', () => {
  it('defines comprehensive security headers including CSP', async () => {
    expect(nextConfig.headers).toBeDefined()
    const headerConfigs = await nextConfig.headers!()

    // Find the global route rule
    const globalRule = headerConfigs.find((rule) => rule.source === '/(.*)')
    expect(globalRule).toBeDefined()

    const headersMap = new Map(globalRule!.headers.map((h) => [h.key, h.value]))

    // Verify critical headers
    expect(headersMap.get('X-Frame-Options')).toBe('DENY')
    expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headersMap.get('Permissions-Policy')).toContain('camera=()')

    // Verify Content-Security-Policy
    const csp = headersMap.get('Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('https://fonts.googleapis.com')
    expect(csp).toContain('https://fonts.gstatic.com')
    expect(csp).toContain('https://*.supabase.co')
    expect(csp).toContain('https://generativelanguage.googleapis.com')
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
