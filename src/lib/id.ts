/**
 * Creates a collision-resistant, unguessable identifier such as `quote-3b1f…`.
 * Backed by `crypto.randomUUID()`, never `Math.random()`.
 */
export function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}
