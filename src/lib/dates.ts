/**
 * Calendar-date helpers for plain `YYYY-MM-DD` strings.
 *
 * Event dates are calendar days, not instants, so everything here works in the
 * user's local time zone and never goes through `toISOString()` (which would
 * shift the day for anyone east or west of UTC).
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Formats a local Date as `YYYY-MM-DD`. */
export function toISODate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses `YYYY-MM-DD` into a local Date at midnight, or undefined if malformed or impossible (e.g. 2026-02-30). */
export function parseISODate(value: string | undefined | null): Date | undefined {
  const match = value ? ISO_DATE.exec(value) : null
  if (!match) return undefined
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return toISODate(date) === value ? date : undefined
}

/** Today as `YYYY-MM-DD` in local time. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

/** True when `value` is a valid date strictly before today. */
export function isPastDate(value: string, now: Date = new Date()): boolean {
  return parseISODate(value) !== undefined && value < todayISO(now)
}

/** Returns `value` if it is today or later, otherwise today. Invalid input also becomes today. */
export function clampToToday(value: string, now: Date = new Date()): string {
  const today = todayISO(now)
  return parseISODate(value) && value >= today ? value : today
}

/**
 * Moves a date forward one year at a time until it is today or later, keeping
 * the day and month. Used for ready-made starters whose fixed dates go stale.
 * Feb 29 rolls to Mar 1 in non-leap years (the Date constructor's behaviour).
 */
export function rollForwardToFuture(value: string, now: Date = new Date()): string {
  const parsed = parseISODate(value)
  if (!parsed) return todayISO(now)
  const today = todayISO(now)
  let year = parsed.getFullYear()
  let candidate = value
  while (candidate < today) {
    year += 1
    candidate = toISODate(new Date(year, parsed.getMonth(), parsed.getDate()))
  }
  return candidate
}

/** "20 Nov 2026" style label for display. */
export function formatDisplayDate(value: string): string {
  const date = parseISODate(value)
  if (!date) return ''
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
