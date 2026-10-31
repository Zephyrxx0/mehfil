import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/plan/[id]/claim/route'
import { NextRequest } from 'next/server'
import { resetRateLimitStore } from '@/lib/security/rate-limit'

// Mock next/headers
const mockCookiesSet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: mockCookiesSet,
  })),
}))

// Mock supabase/server to return null (local fallback mode)
vi.mock('@/lib/supabase/server', () => ({
  getServerRpc: vi.fn(() => null),
  getServiceRpc: vi.fn(() => null),
}))

describe('POST /api/plan/[id]/claim Rate Limiting (Task 1.2)', () => {
  const planId = 'test-plan-uuid'

  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
  })

  it('allows claims within rate limit threshold', async () => {
    const req = new NextRequest(`http://localhost/api/plan/${planId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ key: 'test-key' }),
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '198.51.100.50',
      },
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.authorized).toBe(true)
  })

  it('blocks excessive requests exceeding 10 attempts per minute with 429', async () => {
    process.env.TEST_RATE_LIMIT = 'true'
    try {
      const clientIp = '198.51.100.51'

      // Send 10 allowed requests
      for (let i = 0; i < 10; i++) {
        const req = new NextRequest(`http://localhost/api/plan/${planId}/claim`, {
          method: 'POST',
          body: JSON.stringify({ key: 'test-key' }),
          headers: {
            'content-type': 'application/json',
            'x-real-ip': clientIp,
          },
        })
        const res = await POST(req, { params: Promise.resolve({ id: planId }) })
        expect(res.status).toBe(200)
      }

      // 11th request must be rejected with 429
      const excessReq = new NextRequest(`http://localhost/api/plan/${planId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ key: 'test-key' }),
        headers: {
          'content-type': 'application/json',
          'x-real-ip': clientIp,
        },
      })
      const excessRes = await POST(excessReq, { params: Promise.resolve({ id: planId }) })
      expect(excessRes.status).toBe(429)
      expect(excessRes.headers.get('Retry-After')).toBeDefined()
      const json = await excessRes.json()
      expect(json.error).toMatch(/too many requests/i)
    } finally {
      delete process.env.TEST_RATE_LIMIT
    }
  })
})
