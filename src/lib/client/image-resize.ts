import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/security/image-upload'

/** Files at or under this size are sent untouched. */
const PASSTHROUGH_BYTES = 1_500_000
const MAX_EDGE_PX = 1800
const JPEG_QUALITY = 0.85

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageUploadError'
  }
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new ImageUploadError('Could not read that image.'))
    reader.readAsDataURL(blob)
  })
}

async function downscaleToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new ImageUploadError('Could not prepare that image.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  )
  if (!blob) throw new ImageUploadError('Could not prepare that image.')
  return blob
}

/**
 * Turns a picked file into a data URL that is small enough for the server to accept.
 * Large photos are scaled down in the browser instead of failing at the platform body limit.
 */
export async function prepareQuoteImage(file: File): Promise<string> {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageUploadError('Please choose a PNG, JPEG or WebP image.')
  }
  if (file.size <= PASSTHROUGH_BYTES) return readAsDataUrl(file)

  let scaled: Blob
  try {
    scaled = await downscaleToJpeg(file)
  } catch (err) {
    if (err instanceof ImageUploadError) throw err
    throw new ImageUploadError('That image is too large. Try a smaller photo or a screenshot.')
  }
  if (scaled.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError('That image is too large. Try a smaller photo or a screenshot.')
  }
  return readAsDataUrl(scaled)
}
