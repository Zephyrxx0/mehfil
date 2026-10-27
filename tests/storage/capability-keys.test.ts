import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import {
  generateCapabilityToken,
  hashCapabilityToken,
  constantTimeCompare,
} from '@/lib/engine/crypto'
import { getClientSupabase } from '@/lib/supabase/client'
import { getServerSupabase } from '@/lib/supabase/server'

describe('Capability Tokens & Cryptographic Engine (COLLAB-01, COLLAB-02, D-04)', () => {
  it('generates a 32-byte (64 hex characters) cryptographically secure random token', () => {
    const token = generateCapabilityToken()
    expect(token).toBeTypeOf('string')
    expect(token.length).toBe(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique tokens with 256 bits of entropy across repeated invocations', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 50; i++) {
      tokens.add(generateCapabilityToken())
    }
    expect(tokens.size).toBe(50)
  })

  it('computes exact SHA-256 hash matching Node.js crypto.createHash', async () => {
    const sampleToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const expectedHash = crypto.createHash('sha256').update(sampleToken).digest('hex')

    const computedHash = await hashCapabilityToken(sampleToken)
    expect(computedHash).toBe(expectedHash)
    expect(computedHash.length).toBe(64)
  })

  it('verifies constantTimeCompare accurately identifies identical and non-identical strings', () => {
    const a = '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce'
    const b = '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce'
    const c = '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fcf' // last char diff
    const d = '4e07408562bedb8b60ce05c1decfe3ad' // shorter length

    expect(constantTimeCompare(a, b)).toBe(true)
    expect(constantTimeCompare(a, c)).toBe(false)
    expect(constantTimeCompare(a, d)).toBe(false)
    expect(constantTimeCompare('', '')).toBe(true)
    expect(constantTimeCompare('token', '')).toBe(false)
  })

  describe('Supabase Client Helpers Fallback Behavior', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    afterEach(() => {
      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })

    it('returns null safely when environment variables are unset without throwing errors', async () => {
      expect(getClientSupabase()).toBeNull()
      const serverClient = await getServerSupabase()
      expect(serverClient).toBeNull()
    })
  })
})
