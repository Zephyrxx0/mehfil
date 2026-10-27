import { google } from '@ai-sdk/google'
import { extractStyleDNAWithModel } from './style-analyst'
import { extractDeterministicStyleDNA, type VibeTradeoffs } from './heuristic'
import { getSwatchById } from '@/data/swatches'
import type { StyleDNA, AgentRunRecord } from './schemas'

export interface FallbackLadderOptions {
  timeoutMs?: number
  forceTier?: 1 | 2 | 3
  modelResolver?: (modelId: string) => any
}

export interface FallbackLadderResult {
  styleDNA: StyleDNA
  runRecord: AgentRunRecord
}

function buildStylePrompt(
  selectedSwatchIds: string[],
  protectedMomentQuote: string,
  tradeoffs: VibeTradeoffs
): string {
  const swatches = selectedSwatchIds
    .map((id) => getSwatchById(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined)

  const swatchDetails = swatches
    .map(
      (s) =>
        `- Swatch "${s.title}": ${s.description} (Primary colors: ${s.palette.join(', ')}, Tags: ${s.tags.join(', ')})`
    )
    .join('\n')

  return `Selected Visual References:
${swatchDetails || 'No swatches selected.'}

Protected Moment:
"${protectedMomentQuote}"

Festive Trade-off Balances:
- Feast vs Spectacle: ${tradeoffs.feastVsSpectacle} (feast = culinary focus, spectacle = high visual drama)
- Intimate vs Grand: ${tradeoffs.intimateVsGrand} (intimate = personal cozy gathering, grand = expansive celebration)
- Heritage vs Modern: ${tradeoffs.heritageVsModern} (heritage = traditional roots, modern = sleek contemporary flair)

Tasks:
1. Calibrate 8 aesthetic dimensions (0 to 100 integers): formality, energy, scale, heritageVsModern, feastVsSpectacle, music, decorDensity, indoorVsOutdoor.
2. Select a festive named palette of 3 to 4 distinct hex colors with evocative poetic names (e.g. Marigold Amber, Gulabi Rose, Royal Plum, Warm Ivory).
3. Compose a 1-sentence vibe statement (10 to 200 characters) capturing the essence of the atmosphere.
4. Identify which budget category corresponds directly to the Protected Moment: 'venue', 'catering', 'decor', 'photo_film', 'entertainment', 'favors', 'misc', or 'contingency'.
5. Include the user's verbatim protected moment quote: "${protectedMomentQuote}".`
}

/**
 * Three-tier resilient fallback ladder orchestrator for Style DNA extraction (ADR-0007, D-13, D-15, D-16, GENUI-03).
 *
 * Tier 1: Gemma 4 (gemma-4-31b-it) with 8s timeout & 1-shot repair retry.
 * Tier 2: Gemini 2.0 Flash (gemini-2.0-flash) with 8s timeout.
 * Tier 3: Deterministic heuristic extractor (<5ms, zero-network).
 *
 * Always produces a structured AgentRunRecord and guarantees zero unhandled exceptions or blank screens.
 */
export async function extractStyleDNAWithFallbackLadder(
  selectedSwatchIds: string[],
  protectedMomentQuote: string,
  tradeoffs: VibeTradeoffs,
  options?: FallbackLadderOptions
): Promise<FallbackLadderResult> {
  const startTime = Date.now()

  // Environment Key Check (D-16, T-04-06)
  const hasApiKey = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  )

  if (!hasApiKey && !options?.modelResolver) {
    console.log(
      '[Orchestrator] No Google AI API key detected. Seamlessly executing Tier 3 deterministic heuristic extractor.'
    )
    const styleDNA = extractDeterministicStyleDNA(
      selectedSwatchIds,
      protectedMomentQuote,
      tradeoffs
    )
    const durationMs = Math.max(0, Date.now() - startTime)
    const runRecord: AgentRunRecord = {
      activeTier: 3,
      durationMs,
      modelId: 'deterministic-heuristic-v1',
      fallbackReason: 'api_key_missing',
      timestamp: new Date().toISOString(),
    }
    console.log(JSON.stringify({ event: 'agent_run_record', runRecord }))
    return { styleDNA, runRecord }
  }

  // Force Tier 3 shortcut
  if (options?.forceTier === 3) {
    const styleDNA = extractDeterministicStyleDNA(
      selectedSwatchIds,
      protectedMomentQuote,
      tradeoffs
    )
    const durationMs = Math.max(0, Date.now() - startTime)
    const runRecord: AgentRunRecord = {
      activeTier: 3,
      durationMs,
      modelId: 'deterministic-heuristic-v1',
      fallbackReason: 'forced_tier_3',
      timestamp: new Date().toISOString(),
    }
    console.log(JSON.stringify({ event: 'agent_run_record', runRecord }))
    return { styleDNA, runRecord }
  }

  const resolveModel = options?.modelResolver ?? ((modelId: string) => google(modelId))
  const timeoutMs = options?.timeoutMs ?? 8000
  const prompt = buildStylePrompt(selectedSwatchIds, protectedMomentQuote, tradeoffs)
  let tier1Error: Error | undefined
  let tier2Error: Error | undefined

  // Tier 1: Gemma 4
  if (options?.forceTier === undefined || options.forceTier === 1) {
    try {
      const model = resolveModel('gemma-4-31b-it')
      const extractedDNA = await extractStyleDNAWithModel(model, prompt, timeoutMs)
      const styleDNA: StyleDNA = {
        ...extractedDNA,
        protectedMomentQuote: protectedMomentQuote.trim() || extractedDNA.protectedMomentQuote,
      }
      const durationMs = Math.max(0, Date.now() - startTime)
      const runRecord: AgentRunRecord = {
        activeTier: 1,
        durationMs,
        modelId: 'gemma-4-31b-it',
        timestamp: new Date().toISOString(),
      }
      console.log(JSON.stringify({ event: 'agent_run_record', runRecord }))
      return { styleDNA, runRecord }
    } catch (err: any) {
      tier1Error = err instanceof Error ? err : new Error(String(err))
      console.warn(
        `[Orchestrator] Tier 1 (gemma-4-31b-it) failed: ${tier1Error.message}. Escalating to Tier 2 (gemini-2.0-flash).`
      )
    }
  }

  // Tier 2: Gemini 2.0 Flash
  if (options?.forceTier === undefined || options.forceTier <= 2) {
    try {
      const model = resolveModel('gemini-2.0-flash')
      const extractedDNA = await extractStyleDNAWithModel(model, prompt, timeoutMs)
      const styleDNA: StyleDNA = {
        ...extractedDNA,
        protectedMomentQuote: protectedMomentQuote.trim() || extractedDNA.protectedMomentQuote,
      }
      const durationMs = Math.max(0, Date.now() - startTime)
      const fallbackReason = tier1Error ? `Tier 1 failed: ${tier1Error.message}` : undefined
      const runRecord: AgentRunRecord = {
        activeTier: 2,
        durationMs,
        modelId: 'gemini-2.0-flash',
        ...(fallbackReason ? { fallbackReason } : {}),
        timestamp: new Date().toISOString(),
      }
      console.log(JSON.stringify({ event: 'agent_run_record', runRecord }))
      return { styleDNA, runRecord }
    } catch (err: any) {
      tier2Error = err instanceof Error ? err : new Error(String(err))
      console.warn(
        `[Orchestrator] Tier 2 (gemini-2.0-flash) failed: ${tier2Error.message}. Escalating to Tier 3 (deterministic heuristic).`
      )
    }
  }

  // Tier 3: Deterministic Heuristic
  const styleDNA = extractDeterministicStyleDNA(
    selectedSwatchIds,
    protectedMomentQuote,
    tradeoffs
  )
  const durationMs = Math.max(0, Date.now() - startTime)
  const fallbackReason = tier2Error
    ? `Tier 1 & 2 failed: ${tier2Error.message}`
    : tier1Error
      ? `Tier 1 failed: ${tier1Error.message}`
      : 'tier_3_fallback'

  const runRecord: AgentRunRecord = {
    activeTier: 3,
    durationMs,
    modelId: 'deterministic-heuristic-v1',
    fallbackReason,
    timestamp: new Date().toISOString(),
  }
  console.log(JSON.stringify({ event: 'agent_run_record', runRecord }))
  return { styleDNA, runRecord }
}
