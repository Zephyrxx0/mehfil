import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  resetRateLimitStore,
  UNKNOWN_CLIENT,
} from '@/lib/security/rate-limit'

describe('Security Rate Limiter (Task 6)', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('allows requests within the specified limit', () => {
    const key = 'test-ip-1'
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 10_000)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }
  })

  it('blocks requests exceeding the limit with 429 response', () => {
    const key = 'test-ip-2'
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 10_000)
    }

    const blocked = checkRateLimit(key, 3, 10_000)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetTime).toBeGreaterThan(Date.now())
  })

  describe('client address resolution (S3)', () => {
    const ipOf = (headers: Record<string, string>) =>
      getClientIp(new Request('http://localhost', { headers }))

    it('prefers the platform-set x-vercel-forwarded-for, then x-real-ip', () => {
      expect(ipOf({ 'x-vercel-forwarded-for': '203.0.113.195', 'x-real-ip': '198.51.100.1' })).toBe(
        '203.0.113.195'
      )
      expect(ipOf({ 'x-real-ip': '198.51.100.1' })).toBe('198.51.100.1')
    })

    it('ignores forgeable x-vercel-ip and cf-connecting-ip so a new value does not mean a new bucket', () => {
      const real = { 'x-real-ip': '198.51.100.7' }
      const forgedVercel = ipOf({ ...real, 'x-vercel-ip': '1.1.1.1' })
      const forgedCloudflare = ipOf({ ...real, 'cf-connecting-ip': '2.2.2.2' })
      expect(forgedVercel).toBe('198.51.100.7')
      expect(forgedCloudflare).toBe('198.51.100.7')
    })

    it('uses the LAST x-forwarded-for entry, which the nearest trusted proxy appended', () => {
      // The first entry is whatever the client claimed.
      expect(ipOf({ 'x-forwarded-for': '9.9.9.9, 203.0.113.195' })).toBe('203.0.113.195')
    })

    it('falls back to one shared bucket when no address is available', () => {
      expect(ipOf({})).toBe(UNKNOWN_CLIENT)
    })

    it('cannot be evaded by rotating forged headers on every request', () => {
      process.env.TEST_RATE_LIMIT = 'true'
      try {
        const statuses = Array.from(
          { length: 4 },
          (_, i) =>
            enforceRateLimit(
              new Request('http://localhost', {
                headers: { 'x-real-ip': '198.51.100.9', 'x-vercel-ip': `10.0.0.${i}` },
              }),
              'forged-header-route',
              2,
              60_000
            )?.status
        )
        expect(statuses).toEqual([undefined, undefined, 429, 429])
      } finally {
        delete process.env.TEST_RATE_LIMIT
      }
    })
  })

  it('enforces rate limit through enforceRateLimit helper', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '1.2.3.4' },
    })

    process.env.TEST_RATE_LIMIT = 'true'
    try {
      // 2 requests allowed
      expect(enforceRateLimit(req, 'test-route', 2, 60_000)).toBeNull()
      expect(enforceRateLimit(req, 'test-route', 2, 60_000)).toBeNull()

      // 3rd request blocked
      const res = enforceRateLimit(req, 'test-route', 2, 60_000)
      expect(res).not.toBeNull()
      expect(res?.status).toBe(429)
      expect(res?.headers.get('Retry-After')).toBeDefined()
    } finally {
      delete process.env.TEST_RATE_LIMIT
    }
  })
})
