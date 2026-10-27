/**
 * Cryptographic helpers for capability tokens and constant-time hash comparisons (ADR-0006, D-04).
 * Fully isomorphic: runs in modern browser Web Crypto API and Node.js environments.
 */

/**
 * Generates a 32-byte (256-bit) cryptographically secure random capability token.
 * Formatted as a 64-character lowercase hex string.
 */
export function generateCapabilityToken(): string {
  const bytes = new Uint8Array(32)

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto')
    nodeCrypto.randomFillSync(bytes)
  }

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Computes the SHA-256 hash of a capability token string.
 * Returns a 64-character lowercase hex string.
 */
export async function hashCapabilityToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto')
    return nodeCrypto.createHash('sha256').update(token).digest('hex')
  }
}

/**
 * Performs a constant-time comparison of two ASCII/hex strings to prevent timing side-channel attacks.
 * Returns true if both strings are identical in length and content.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
