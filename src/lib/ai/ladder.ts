import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import { createLogger } from '@/lib/logger'
import { tryConsumeModelCall } from '@/lib/security/model-budget'
import { classifyModelError, type FallbackReason, type ModelFailureCode } from './errors'
import { TIER_1_MODEL_ID, TIER_2_MODEL_ID, TIER_3_MODEL_ID } from './run-record'
import type { AgentRunRecord } from './schemas'

const logger = createLogger('ladder')

export interface FallbackLadderOptions {
  timeoutMs?: number
  /** Restricts the ladder: 1 = start at tier 1, 2 = skip tier 1, 3 = deterministic only. */
  forceTier?: 1 | 2 | 3
  /** Supplies the model for a given id. Defaults to the Google provider. Tests inject fakes. */
  modelResolver?: (modelId: string) => LanguageModel
}

export interface LadderResult<T> {
  value: T
  runRecord: AgentRunRecord
}

interface LadderSpec<T> {
  /** Short name used in logs, e.g. `style-dna`. */
  agent: string
  /** Runs the model call for one tier. Must throw on any failure. */
  callModel: (model: LanguageModel, timeoutMs: number) => Promise<T>
  /** Pure-code result used when every model tier is unavailable or failed. */
  deterministic: () => T
  options?: FallbackLadderOptions
}

const DEFAULT_TIMEOUT_MS = 8000

function hasApiKey(): boolean {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  )
}

function failureReason(
  tier1: ModelFailureCode | undefined,
  tier2: ModelFailureCode | undefined
): FallbackReason {
  if (tier1 && tier2) return `tier_1_2_failed:${tier2}`
  if (tier2) return `tier_2_failed:${tier2}`
  if (tier1) return `tier_1_failed:${tier1}`
  return 'tier_3_fallback'
}

/**
 * Three-tier resilient fallback ladder shared by every agent (ADR-0007).
 *
 * Tier 1 (Gemma) -> Tier 2 (Gemini Flash Lite) -> Tier 3 (pure code). The ladder never throws:
 * a failed model call is logged on the server, and the run record carries only a stable
 * reason code, never raw error text.
 */
export async function runLadder<T>(spec: LadderSpec<T>): Promise<LadderResult<T>> {
  const { agent, callModel, deterministic, options } = spec
  const startTime = Date.now()

  const finish = (
    value: T,
    activeTier: 1 | 2 | 3,
    modelId: string,
    fallbackReason?: FallbackReason
  ): LadderResult<T> => {
    const runRecord: AgentRunRecord = {
      activeTier,
      durationMs: Math.max(0, Date.now() - startTime),
      modelId,
      ...(fallbackReason ? { fallbackReason } : {}),
      timestamp: new Date().toISOString(),
    }
    logger.info('agent_run_record', { agent, runRecord })
    return { value, runRecord }
  }

  const usesRealProvider = !options?.modelResolver
  if (usesRealProvider && !hasApiKey()) {
    return finish(deterministic(), 3, TIER_3_MODEL_ID, 'api_key_missing')
  }
  if (options?.forceTier === 3) {
    return finish(deterministic(), 3, TIER_3_MODEL_ID, 'forced_tier_3')
  }
  if (usesRealProvider && !tryConsumeModelCall()) {
    return finish(deterministic(), 3, TIER_3_MODEL_ID, 'daily_model_cap_reached')
  }

  const resolveModel = options?.modelResolver ?? ((modelId: string) => google(modelId))
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  let tier1Failure: ModelFailureCode | undefined
  let tier2Failure: ModelFailureCode | undefined

  if (options?.forceTier === undefined || options.forceTier === 1) {
    try {
      const value = await callModel(resolveModel(TIER_1_MODEL_ID), timeoutMs)
      return finish(value, 1, TIER_1_MODEL_ID)
    } catch (err) {
      tier1Failure = classifyModelError(err)
      logger.warn('tier 1 failed, escalating to tier 2', { agent, code: tier1Failure, err })
    }
  }

  if (options?.forceTier === undefined || options.forceTier <= 2) {
    try {
      const value = await callModel(resolveModel(TIER_2_MODEL_ID), timeoutMs)
      return finish(
        value,
        2,
        TIER_2_MODEL_ID,
        tier1Failure ? `tier_1_failed:${tier1Failure}` : undefined
      )
    } catch (err) {
      tier2Failure = classifyModelError(err)
      logger.warn('tier 2 failed, using deterministic tier 3', { agent, code: tier2Failure, err })
    }
  }

  return finish(deterministic(), 3, TIER_3_MODEL_ID, failureReason(tier1Failure, tier2Failure))
}
