/**
 * Daily ceiling on paid model calls (S3). Once the ceiling is reached, routes force the
 * deterministic Tier 3 path, so the app keeps working and a flood of requests, including
 * ones that dodge per-IP limits, cannot run up the Gemini bill.
 *
 * With the server-only service key configured, the count is shared by every server instance
 * through Postgres, so `MODEL_DAILY_CAP` is the real daily ceiling. Without it the count is per
 * instance (exact locally, and a multiple of the cap on serverless hosting). Either way, also set
 * a spend limit in the Google AI console. See ADR-0011.
 */
import { resetMemoryModelBudget } from './memory-limits'
import { getLimits, resetLimitsForTests } from './shared-limits'

const DEFAULT_DAILY_CAP = 300

export function getDailyModelCap(): number {
  const configured = Number.parseInt(process.env.MODEL_DAILY_CAP ?? '', 10)
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_DAILY_CAP
}

/**
 * Reserves one model call. Returns false when today's ceiling is reached, in which case the
 * caller must use the deterministic tier instead.
 */
export function tryConsumeModelCall(now: Date = new Date()): Promise<boolean> {
  return getLimits().takeModelCall(getDailyModelCap(), now)
}

/** Clears the counters this process holds (used in unit tests). */
export function resetModelBudget(): void {
  resetMemoryModelBudget()
  resetLimitsForTests()
}
