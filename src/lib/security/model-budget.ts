/**
 * Daily ceiling on paid model calls (S3). Once the ceiling is reached, routes force the
 * deterministic Tier 3 path, so the app keeps working and a flood of requests, including
 * ones that dodge per-IP limits, cannot run up the Gemini bill.
 *
 * Counters are per server instance. On serverless hosting each warm instance counts on its
 * own, so the effective ceiling is `MODEL_DAILY_CAP x concurrent instances`. Set the cap with
 * that in mind, and also set a spend limit in the Google AI console.
 */

const DEFAULT_DAILY_CAP = 300

let currentDay = ''
let callsToday = 0

function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export function getDailyModelCap(): number {
  const configured = Number.parseInt(process.env.MODEL_DAILY_CAP ?? '', 10)
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_DAILY_CAP
}

/**
 * Reserves one model call. Returns false when today's ceiling is reached, in which case the
 * caller must use the deterministic tier instead.
 */
export function tryConsumeModelCall(now: Date = new Date()): boolean {
  const day = utcDay(now)
  if (day !== currentDay) {
    currentDay = day
    callsToday = 0
  }
  if (callsToday >= getDailyModelCap()) return false
  callsToday += 1
  return true
}

/** Clears the counter (used in unit tests). */
export function resetModelBudget(): void {
  currentDay = ''
  callsToday = 0
}
