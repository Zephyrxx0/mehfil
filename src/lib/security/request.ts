import { NextResponse } from 'next/server'

/** Largest JSON body the AI routes accept. Vercel Functions reject bodies over ~4.5 MB. */
const MAX_JSON_BODY_BYTES = 4_400_000

export type JsonBodyResult = { ok: true; body: unknown } | { ok: false; response: NextResponse }

function reject(status: number, error: string): JsonBodyResult {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status }) }
}

/**
 * Reads a JSON request body with a hard size limit. The Content-Length header is checked
 * before anything is buffered, and the actual text length is checked again because the
 * header can be absent (chunked transfer) or wrong.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number = MAX_JSON_BODY_BYTES
): Promise<JsonBodyResult> {
  const declared = request.headers.get('content-length')
  if (declared !== null) {
    const length = Number(declared)
    if (!Number.isInteger(length) || length < 0) return reject(400, 'Invalid Content-Length')
    if (length > maxBytes) return reject(413, 'Request body too large')
  }

  let text: string
  try {
    text = await request.text()
  } catch {
    return reject(400, 'Invalid request payload')
  }
  if (new TextEncoder().encode(text).length > maxBytes) {
    return reject(413, 'Request body too large')
  }

  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return reject(400, 'Invalid JSON request payload')
  }
}
