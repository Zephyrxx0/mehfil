import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EDIT_SESSION_TTL_SECONDS,
  createEditSession,
  isEditSessionConfigured,
  verifyEditSession,
} from '@/lib/security/edit-session'

describe('signed edit session (S4)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('verifies a freshly issued session for the same plan', async () => {
    const session = await createEditSession('plan-1')
    expect(await verifyEditSession('plan-1', session)).toBe(true)
  })

  it('is bound to its plan id', async () => {
    const session = await createEditSession('plan-1')
    expect(await verifyEditSession('plan-2', session)).toBe(false)
  })

  it('rejects a tampered signature or a stretched expiry', async () => {
    const [version, expires, mac] = (await createEditSession('plan-1')).split('.')
    const flipped = mac.slice(0, -1) + (mac.endsWith('A') ? 'B' : 'A')
    expect(await verifyEditSession('plan-1', `${version}.${expires}.${flipped}`)).toBe(false)
    expect(await verifyEditSession('plan-1', `${version}.${Number(expires) + 99999}.${mac}`)).toBe(
      false
    )
  })

  it('expires after the TTL', async () => {
    const issuedAt = Date.UTC(2026, 9, 31, 12, 0, 0)
    const session = await createEditSession('plan-1', issuedAt)
    const justBefore = issuedAt + (EDIT_SESSION_TTL_SECONDS - 5) * 1000
    const justAfter = issuedAt + (EDIT_SESSION_TTL_SECONDS + 5) * 1000
    expect(await verifyEditSession('plan-1', session, justBefore)).toBe(true)
    expect(await verifyEditSession('plan-1', session, justAfter)).toBe(false)
  })

  it('rejects malformed values, including the old stored-hash style cookie', async () => {
    for (const value of [undefined, '', 'v1', 'v1.abc.def', 'v2.9999999999.abc', 'a'.repeat(64)]) {
      expect(await verifyEditSession('plan-1', value)).toBe(false)
    }
  })

  it('does not embed the plan id or any key material in the cookie value', async () => {
    const session = await createEditSession('plan-secret-id')
    expect(session).not.toContain('plan-secret-id')
    expect(session).toMatch(/^v1\.\d+\.[A-Za-z0-9_-]+$/)
  })

  it('refuses to sign in production without a long enough secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('EDIT_SESSION_SECRET', 'too-short')
    expect(isEditSessionConfigured()).toBe(false)
    await expect(createEditSession('plan-1')).rejects.toThrow(/EDIT_SESSION_SECRET/)

    vi.stubEnv('EDIT_SESSION_SECRET', 'x'.repeat(40))
    expect(isEditSessionConfigured()).toBe(true)
    expect(await verifyEditSession('plan-1', await createEditSession('plan-1'))).toBe(true)
  })
})
