import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageUploadError, prepareQuoteImage } from '@/lib/client/image-resize'
import { MAX_IMAGE_BYTES, validateImageDataUrl } from '@/lib/security/image-upload'

const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]

function fileOf(type: string, size: number, head: number[] = PNG_HEAD): File {
  const bytes = new Uint8Array(size)
  bytes.set(head.slice(0, Math.min(head.length, size)))
  return new File([bytes], 'quote', { type })
}

afterEach(() => vi.unstubAllGlobals())

describe('prepareQuoteImage (S5, browser side)', () => {
  it('rejects anything that is not a PNG, JPEG or WebP before reading it', async () => {
    for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', 'text/html', '']) {
      await expect(prepareQuoteImage(fileOf(type, 100))).rejects.toThrow(ImageUploadError)
    }
  })

  it('passes a small image through unchanged as a data URL the server will accept', async () => {
    const dataUrl = await prepareQuoteImage(fileOf('image/png', 2000))
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    expect(validateImageDataUrl(dataUrl).ok).toBe(true)
  })

  it('scales a large photo down to a JPEG that fits the server limit', async () => {
    const drawn: Array<[number, number]> = []
    vi.stubGlobal('createImageBitmap', async () => ({ width: 6000, height: 4000, close: () => {} }))
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: (_i: unknown, _x: number, _y: number, w: number, h: number) =>
          drawn.push([w, h]),
      }),
      toBlob: (cb: (b: Blob | null) => void) => {
        const jpeg = new Uint8Array(400_000)
        jpeg.set([0xff, 0xd8, 0xff, 0xe0])
        cb(new Blob([jpeg], { type: 'image/jpeg' }))
      },
    }
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement)

    const dataUrl = await prepareQuoteImage(fileOf('image/png', 5_000_000))

    expect(drawn[0]).toEqual([1800, 1200]) // longest edge capped, aspect ratio kept
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(validateImageDataUrl(dataUrl).ok).toBe(true)
  })

  it('tells the user kindly when a large image cannot be prepared', async () => {
    vi.stubGlobal('createImageBitmap', async () => {
      throw new Error('decode failed')
    })
    await expect(prepareQuoteImage(fileOf('image/png', 5_000_000))).rejects.toThrow(
      /too large|smaller photo/i
    )
  })

  it('still refuses a result that is over the limit after scaling', async () => {
    vi.stubGlobal('createImageBitmap', async () => ({ width: 100, height: 100, close: () => {} }))
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => ({ drawImage: () => {} }),
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)])),
    } as unknown as HTMLElement)
    await expect(prepareQuoteImage(fileOf('image/png', 5_000_000))).rejects.toThrow(
      ImageUploadError
    )
  })
})
