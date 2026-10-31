/**
 * Validation for quote images that arrive as `data:` URLs (S5).
 *
 * The browser file picker only filters by extension, so the server checks three things itself:
 * the declared type is on the allow-list, the decoded size is under the limit, and the first
 * bytes of the file really are that image format.
 */

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

/** Decoded image ceiling. Leaves headroom under the ~4.5 MB platform body limit. */
export const MAX_IMAGE_BYTES = 3_000_000
/** Longest data URL that can hold MAX_IMAGE_BYTES (base64 grows data by 4/3, plus the prefix). */
export const MAX_IMAGE_DATA_URL_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 64

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/

export type ImageValidation =
  | { ok: true; mimeType: AllowedImageType; bytes: number }
  | { ok: false; reason: 'format' | 'too_large' | 'signature_mismatch' }

function decodedLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length * 3) / 4 - padding
}

function leadingBytes(base64: string, count: number): Uint8Array {
  // 4 base64 characters carry 3 bytes, so this slice always decodes cleanly.
  const chars = Math.ceil(count / 3) * 4
  const binary = atob(base64.slice(0, chars))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function matchesSignature(type: AllowedImageType, head: Uint8Array): boolean {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => head[offset + i] === b)
  switch (type) {
    case 'image/png':
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'image/jpeg':
      return startsWith([0xff, 0xd8, 0xff])
    case 'image/webp':
      // "RIFF" <size> "WEBP"
      return startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)
  }
}

export function validateImageDataUrl(dataUrl: string): ImageValidation {
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) return { ok: false, reason: 'too_large' }

  const match = DATA_URL_PATTERN.exec(dataUrl)
  if (!match) return { ok: false, reason: 'format' }

  const mimeType = match[1] as AllowedImageType
  const base64 = match[2]
  if (base64.length % 4 !== 0) return { ok: false, reason: 'format' }

  const bytes = decodedLength(base64)
  if (bytes > MAX_IMAGE_BYTES) return { ok: false, reason: 'too_large' }

  let head: Uint8Array
  try {
    head = leadingBytes(base64, 12)
  } catch {
    return { ok: false, reason: 'format' }
  }
  if (!matchesSignature(mimeType, head)) return { ok: false, reason: 'signature_mismatch' }

  return { ok: true, mimeType, bytes }
}
