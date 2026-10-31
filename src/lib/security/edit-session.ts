/**
 * Signed edit-session cookies (S4).
 *
 * After a visitor proves they hold the edit key, the server hands out a cookie that only says
 * "this browser proved it for plan X until time T", signed with a server secret. The cookie
 * never contains the key or its stored hash, so leaking it exposes nothing reusable elsewhere
 * and it expires on its own.
 *
 * Format: `v1.<expiresAtUnixSeconds>.<base64url HMAC-SHA256 of "planId.expiresAt">`
 */
import { constantTimeCompare } from '@/lib/engine/crypto'

export const EDIT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const EDIT_COOKIE_PREFIX = 'mehfil_edit_'

const VERSION = 'v1'
const MIN_SECRET_LENGTH = 32

let ephemeralSecret: string | undefined

export function editCookieName(planId: string): string {
  return `${EDIT_COOKIE_PREFIX}${planId}`
}

/** True when sessions can be signed safely in this environment. */
export function isEditSessionConfigured(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return (process.env.EDIT_SESSION_SECRET?.length ?? 0) >= MIN_SECRET_LENGTH
}

function getSecret(): string {
  const configured = process.env.EDIT_SESSION_SECRET
  if (configured && configured.length >= MIN_SECRET_LENGTH) return configured
  if (process.env.NODE_ENV === 'production') {
    throw new Error('EDIT_SESSION_SECRET must be set to at least 32 characters in production')
  }
  // Development and tests: a random per-process secret keeps sessions working without setup.
  ephemeralSecret ??= Array.from(globalThis.crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
  return ephemeralSecret
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sign(planId: string, expiresAt: number): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${planId}.${expiresAt}`)
  )
  return toBase64Url(mac)
}

export async function createEditSession(
  planId: string,
  nowMs: number = Date.now()
): Promise<string> {
  const expiresAt = Math.floor(nowMs / 1000) + EDIT_SESSION_TTL_SECONDS
  return `${VERSION}.${expiresAt}.${await sign(planId, expiresAt)}`
}

export async function verifyEditSession(
  planId: string,
  cookieValue: string | undefined,
  nowMs: number = Date.now()
): Promise<boolean> {
  if (!cookieValue) return false
  const [version, expiresRaw, mac] = cookieValue.split('.')
  if (version !== VERSION || !expiresRaw || !mac || !/^\d+$/.test(expiresRaw)) return false

  const expiresAt = Number(expiresRaw)
  if (expiresAt <= Math.floor(nowMs / 1000)) return false

  return constantTimeCompare(mac, await sign(planId, expiresAt))
}
