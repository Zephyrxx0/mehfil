import { describe, expect, it } from 'vitest'
import { readJsonBody } from '@/lib/security/request'

// happy-dom's Request drops Content-Length (a forbidden header in browsers), but Node requests
// keep it, so this double carries the header the way the real runtime does.
const post = (body: string, headers: Record<string, string> = {}) =>
  ({ headers: new Headers(headers), text: async () => body }) as unknown as Request

describe('readJsonBody (S5)', () => {
  it('parses a small JSON body', async () => {
    const result = await readJsonBody(post('{"a":1}'))
    expect(result).toEqual({ ok: true, body: { a: 1 } })
  })

  it('rejects an oversize Content-Length with 413 before reading the body', async () => {
    const result = await readJsonBody(post('{}', { 'content-length': '9999999' }), 1000)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(413)
  })

  it('rejects a body that is larger than it claimed', async () => {
    const result = await readJsonBody(post(JSON.stringify({ pad: 'x'.repeat(2000) })), 1000)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(413)
  })

  it('rejects a negative or non-numeric Content-Length with 400', async () => {
    const result = await readJsonBody(post('{}', { 'content-length': '-5' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(400)
  })

  it('returns 400 for invalid JSON', async () => {
    const result = await readJsonBody(post('{not json'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(400)
  })
})
