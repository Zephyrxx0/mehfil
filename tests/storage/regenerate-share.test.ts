import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/plan/[id]/regenerate-share/route'
import { NextRequest } from 'next/server'
import * as cryptoEngine from '@/lib/engine/crypto'
import { createEditSession } from '@/lib/security/edit-session'
import { resetRateLimitStore } from '@/lib/security/rate-limit'

// Mock next/headers
const mockCookiesGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}))

// Mock supabase/server
const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()
let mockSupabaseClient: any = null

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: vi.fn(async () => mockSupabaseClient),
}))

describe('POST /api/plan/[id]/regenerate-share (Security Audit Remediation)', () => {
  const planId = 'test-plan-uuid-123'
  const validEditKey = 'secret-edit-key-456'
  let validHash: string

  beforeEach(async () => {
    vi.clearAllMocks()
    resetRateLimitStore()
    validHash = await cryptoEngine.hashCapabilityToken(validEditKey)

    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockSingle.mockResolvedValue({
      data: { id: planId, edit_key_hash: validHash },
      error: null,
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    mockSupabaseClient = {
      from: mockFrom,
    }
  })

  it('rejects request with 401 when no auth cookie or body key is provided', async () => {
    mockCookiesGet.mockReturnValue(undefined)

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/Unauthorized/i)
  })

  it('rejects request with 401 when the cookie is not a valid signed session', async () => {
    mockCookiesGet.mockReturnValue({ value: 'forged-cookie-hash' })

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(401)
    const json = await res.json()
    // Rejected before any database lookup: a forged cookie carries no key to check.
    expect(json.error).toMatch(/Unauthorized/i)
  })

  it('rejects the stored edit_key_hash used as a cookie (no longer a credential)', async () => {
    mockCookiesGet.mockReturnValue({ value: validHash })

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(401)
  })

  it('rejects a signed session that was issued for a different plan', async () => {
    mockCookiesGet.mockReturnValue({ value: await createEditSession('some-other-plan') })

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(401)
  })

  it('accepts request with 200 when the cookie is a valid signed session for this plan', async () => {
    mockCookiesGet.mockReturnValue({ value: await createEditSession(planId) })

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.shareToken).toBeDefined()
    expect(json.shareToken.length).toBe(64)
  })

  it('accepts request with 200 when valid raw key is provided in body', async () => {
    mockCookiesGet.mockReturnValue(undefined)

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
      body: JSON.stringify({ key: validEditKey }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.shareToken).toBeDefined()
  })

  it('handles offline fallback mode safely when Supabase is not configured', async () => {
    mockSupabaseClient = null
    mockCookiesGet.mockReturnValue({ value: await createEditSession(planId) })

    const req = new NextRequest(`http://localhost:3000/api/plan/${planId}/regenerate-share`, {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: planId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('regenerated_local')
    expect(json.shareToken).toBeDefined()
  })
})
