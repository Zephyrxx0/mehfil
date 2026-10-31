/**
 * Prompt quarantine helpers (S7, S8, ADR-0003).
 *
 * Untrusted text (vendor quotes, the user's "protected moment" sentence) is wrapped in a tag
 * whose name contains a random suffix chosen per request. The system prompt names that exact
 * tag, so text inside the data block cannot close it early: it would have to guess the suffix.
 * As a second layer, any tag-like sequence that starts with the label is removed from the data.
 */

export interface FencedText {
  /** Full tag name, e.g. `untrusted_vendor_quote_9f2c4a7b10de`. */
  tag: string
  /** The wrapped text, ready to place in a prompt. */
  text: string
}

// Zero-width, bidi-control and other invisible characters used to hide instructions.
const INVISIBLE_CHARACTERS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g
// C0 and C1 control characters except tab (\t) and newline (\n).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g

function randomSuffix(): string {
  const bytes = new Uint8Array(6)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Removes control and invisible characters. Keeps tabs and newlines. */
export function stripControlCharacters(text: string): string {
  return text.replace(INVISIBLE_CHARACTERS, '').replace(CONTROL_CHARACTERS, '')
}

/** Cleans a short single-line user sentence: strips control characters and collapses spaces. */
export function sanitizeSingleLine(text: string, maxLength: number): string {
  return stripControlCharacters(text).replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

/**
 * Wraps untrusted text in a per-request random tag. `label` must be lowercase letters and
 * underscores; it becomes the readable part of the tag name.
 */
export function fenceUntrustedText(label: string, raw: string): FencedText {
  const tag = `${label}_${randomSuffix()}`
  const lookalikeTags = new RegExp(`<\\s*/?\\s*${label}[^>]*>`, 'gi')
  const neutralised = stripControlCharacters(raw).replace(lookalikeTags, '[removed tag]')
  return { tag, text: `<${tag}>\n${neutralised}\n</${tag}>` }
}
