import { generateObject } from 'ai'
import { StyleDNASchema, type StyleDNA } from './schemas'

export const STYLE_ANALYST_SYSTEM_PROMPT =
  'You are the Mehfil Style Analyst. Analyze festive visual references and extract structured aesthetic Style DNA. STRICT SAFEGUARD: Describe aesthetics, decor, lighting, atmosphere, colors, and objects ONLY. Never infer, mention, or speculate on religion, caste, ethnicity, health, or demographic identity.'

export function isTimeoutOrAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const error = err as { name?: string; message?: string; cause?: unknown }
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return true
  if (error.cause && typeof error.cause === 'object') {
    const cause = error.cause as { name?: string }
    if (cause.name === 'TimeoutError' || cause.name === 'AbortError') return true
  }
  if (
    typeof error.message === 'string' &&
    (error.message.includes('timeout') ||
      error.message.includes('aborted') ||
      error.message.includes('AbortError') ||
      error.message.includes('TimeoutError'))
  ) {
    return true
  }
  return false
}

/**
 * Extracts structured Style DNA using a provided AI model instance with an 8s timeout
 * and a 1-shot zero-temperature schema repair retry (D-05, D-13, GENUI-03).
 */
export async function extractStyleDNAWithModel(
  modelInstance: any,
  prompt: string,
  timeoutMs = 8000
): Promise<StyleDNA> {
  const startTime = Date.now()

  try {
    const { object } = await generateObject({
      model: modelInstance,
      schema: StyleDNASchema,
      system: STYLE_ANALYST_SYSTEM_PROMPT,
      prompt,
      abortSignal: AbortSignal.timeout(timeoutMs),
      temperature: 0.2,
    })

    return StyleDNASchema.parse(object)
  } catch (err: any) {
    // Escalate immediately on timeouts or explicit aborts
    if (isTimeoutOrAbortError(err)) {
      throw err
    }

    // 1-Shot Schema Repair Retry at temperature 0 (D-13, T-04-04)
    const elapsed = Date.now() - startTime
    const remainingTimeout = Math.max(2000, timeoutMs - elapsed)
    const repairPrompt = `${prompt}\n\nThe previous output failed validation: ${err instanceof Error ? err.message : String(err)}. Please correct the JSON output to strictly match the schema.`

    const { object: repaired } = await generateObject({
      model: modelInstance,
      schema: StyleDNASchema,
      system: STYLE_ANALYST_SYSTEM_PROMPT,
      prompt: repairPrompt,
      abortSignal: AbortSignal.timeout(remainingTimeout),
      temperature: 0,
    })

    return StyleDNASchema.parse(repaired)
  }
}
