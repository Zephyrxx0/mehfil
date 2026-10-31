import { isTimeoutOrAbortError } from './style-analyst'

/**
 * Stable, client-safe reasons a model call failed (S6). Raw error text can contain provider
 * details, request fragments or key hints, so it is logged on the server and never returned.
 */
export type ModelFailureCode =
  'model_timeout' | 'model_rate_limited' | 'model_invalid_output' | 'model_unavailable'

export type FallbackReason =
  | 'api_key_missing'
  | 'forced_tier_3'
  | 'daily_model_cap_reached'
  | 'tier_3_fallback'
  | 'emergency_route_recovery'
  | 'client_fallback'
  | `tier_1_failed:${ModelFailureCode}`
  | `tier_2_failed:${ModelFailureCode}`
  | `tier_1_2_failed:${ModelFailureCode}`

const INVALID_OUTPUT_NAMES = new Set([
  'ZodError',
  'AI_NoObjectGeneratedError',
  'AI_TypeValidationError',
  'AI_JSONParseError',
])

export function classifyModelError(err: unknown): ModelFailureCode {
  if (isTimeoutOrAbortError(err)) return 'model_timeout'

  if (err && typeof err === 'object') {
    const { name, statusCode, status } = err as {
      name?: string
      statusCode?: number
      status?: number
    }
    if (statusCode === 429 || status === 429) return 'model_rate_limited'
    if (name && INVALID_OUTPUT_NAMES.has(name)) return 'model_invalid_output'
  }

  const message = err instanceof Error ? err.message : String(err)
  if (/\b429\b|rate.?limit|quota|resource.?exhausted/i.test(message)) return 'model_rate_limited'
  return 'model_unavailable'
}
