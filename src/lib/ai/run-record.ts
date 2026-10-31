import type { FallbackReason } from './errors'
import type { AgentRunRecord } from './schemas'

export const TIER_1_MODEL_ID = 'gemma-4-31b-it'
export const TIER_2_MODEL_ID = 'gemini-3.5-flash-lite'
export const TIER_3_MODEL_ID = 'deterministic-heuristic-v1'

/**
 * Run record for a result produced by pure code outside the ladder (route or client recovery).
 * Safe to import from client components: no provider or server-only code lives here.
 */
export function deterministicRunRecord(fallbackReason: FallbackReason): AgentRunRecord {
  return {
    activeTier: 3,
    durationMs: 0,
    modelId: TIER_3_MODEL_ID,
    fallbackReason,
    timestamp: new Date().toISOString(),
  }
}
