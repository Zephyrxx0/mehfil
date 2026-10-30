import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  resetRateLimitStore,
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

  it('correctly extracts IP address from x-forwarded-for headers', () => {
    const req1 = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    })
    expect(getClientIp(req1)).toBe('203.0.113.195')

    const req2 = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.1' },
    })
    expect(getClientIp(req2)).toBe('198.51.100.1')

    const req3 = new Request('http://localhost')
    expect(getClientIp(req3)).toBe('127.0.0.1')
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
