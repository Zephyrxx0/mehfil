import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, validateImageDataUrl } from '@/lib/security/image-upload'

const toDataUrl = (type: string, bytes: number[], padTo = 0) => {
  const data = Uint8Array.from([...bytes, ...new Array(Math.max(0, padTo - bytes.length)).fill(0)])
  return `data:${type};base64,${Buffer.from(data).toString('base64')}`
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

describe('quote image validation (S5)', () => {
  it('accepts real PNG, JPEG and WebP headers', () => {
    expect(validateImageDataUrl(toDataUrl('image/png', PNG)).ok).toBe(true)
    expect(validateImageDataUrl(toDataUrl('image/jpeg', JPEG)).ok).toBe(true)
    expect(validateImageDataUrl(toDataUrl('image/webp', WEBP)).ok).toBe(true)
  })

  it('rejects a file whose bytes do not match its declared type', () => {
    const html = Array.from(Buffer.from('<script>alert(1)</script>'))
    expect(validateImageDataUrl(toDataUrl('image/png', html))).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    })
    expect(validateImageDataUrl(toDataUrl('image/jpeg', PNG))).toMatchObject({ ok: false })
  })

  it('rejects types outside the allow-list, including SVG and GIF', () => {
    expect(validateImageDataUrl(toDataUrl('image/svg+xml', PNG))).toMatchObject({
      ok: false,
      reason: 'format',
    })
    expect(validateImageDataUrl(toDataUrl('image/gif', PNG))).toMatchObject({ ok: false })
    expect(validateImageDataUrl('https://evil.example/a.png')).toMatchObject({ ok: false })
  })

  it('rejects malformed base64', () => {
    expect(validateImageDataUrl('data:image/png;base64,@@@@')).toMatchObject({ ok: false })
    expect(validateImageDataUrl('data:image/png;base64,abc')).toMatchObject({ ok: false })
  })

  it('rejects images over the size limit before decoding them', () => {
    const big = toDataUrl('image/png', PNG, MAX_IMAGE_BYTES + 10)
    expect(validateImageDataUrl(big)).toEqual({ ok: false, reason: 'too_large' })
  })

  it('accepts an image just under the limit', () => {
    const ok = toDataUrl('image/png', PNG, MAX_IMAGE_BYTES - 10)
    expect(validateImageDataUrl(ok).ok).toBe(true)
  })
})
