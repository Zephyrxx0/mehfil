/**
 * Content-Security-Policy builder (S9).
 *
 * Production: scripts run only if they carry this request's nonce (`'strict-dynamic'` then lets
 * those trusted scripts load the others), and `unsafe-eval` and `unsafe-inline` are absent from
 * `script-src`. Development adds `unsafe-eval` and websocket access for React Refresh.
 *
 * Fonts are self-hosted by next/font, every image is served from this origin or inlined as a
 * data/blob URL, and the browser never calls the Gemini API (only the server does), so none
 * of those hosts are allowed.
 */

export interface CspOptions {
  nonce: string
  isDevelopment: boolean
}

export function buildContentSecurityPolicy({ nonce, isDevelopment }: CspOptions): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
  if (isDevelopment) scriptSrc.push("'unsafe-eval'")

  const connectSrc = ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co']
  if (isDevelopment) connectSrc.push('ws://localhost:*', 'http://localhost:*')

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    // Motion and Radix set inline style attributes, which cannot carry a nonce.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ]
  if (!isDevelopment) directives.push('upgrade-insecure-requests')

  return directives.join('; ')
}

/** 128-bit random nonce, base64 encoded. A fresh one is needed for every request. */
export function generateNonce(): string {
  return btoa(globalThis.crypto.randomUUID())
}
