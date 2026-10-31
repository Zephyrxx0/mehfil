import { NextResponse } from 'next/server'
import { getLimits } from './shared-limits'

export { checkRateLimit, resetRateLimitStore } from './memory-limits'

/** Bucket shared by every request whose address cannot be determined. */
export const UNKNOWN_CLIENT = 'unknown'

/**
 * Resolves the client address from headers the hosting platform sets itself.
 *
 * Only `x-vercel-forwarded-for` and `x-real-ip` are trusted first: Vercel overwrites both,
 * so a caller cannot choose them. `x-vercel-ip` is not a documented client-address header and
 * `cf-connecting-ip` is only meaningful behind Cloudflare, so a forged value in either would
 * hand an attacker a fresh bucket per request; they are ignored. As a last resort we use the
 * LAST `x-forwarded-for` entry, which is the one appended by the nearest trusted proxy, never
 * the first, which the client controls.
 */
export function getClientIp(request: Request): string {
  const platformHeader =
    request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip')
  const platformIp = platformHeader?.split(',')[0]?.trim()
  if (platformIp) return platformIp

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const nearestProxyEntry = forwardedFor.split(',').at(-1)?.trim()
    if (nearestProxyEntry) return nearestProxyEntry
  }
  return UNKNOWN_CLIENT
}

/**
 * The bucket name for one client on one route. Client addresses are personal data, so when the
 * counters are shared in the database the address is stored only as a keyed hash: the key is
 * the server-only service key, so the hashes cannot be reversed by trying every IPv4 address.
 */
async function bucketFor(route: string, ip: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!secret) return `${route}:${ip}`

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip))
  const hex = Array.from(new Uint8Array(mac).slice(0, 16), (b) => b.toString(16).padStart(2, '0'))
  return `${route}:${hex.join('')}`
}

/**
 * Rate limit helper for route handlers.
 * Returns a 429 NextResponse if rate limit exceeded, or null if allowed.
 */
export async function enforceRateLimit(
  request: Request,
  routeIdentifier: string,
  limit = 15,
  windowMs = 60_000
): Promise<NextResponse | null> {
  // Allow disabling in tests if specified
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT) {
    return null
  }

  const bucket = await bucketFor(routeIdentifier, getClientIp(request))
  const result = await getLimits().hit(bucket, limit, windowMs)

  if (!result.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000))
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment before trying again.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
        },
      }
    )
  }

  return null
}
