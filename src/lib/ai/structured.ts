import { generateText, Output, type LanguageModel, type ModelMessage } from 'ai'
import type { z } from 'zod'

/**
 * Whether an error came from a timeout or an abort. These escalate to the next ladder tier
 * immediately instead of spending the repair retry.
 */
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

/** Either a plain `prompt` string or a `messages` array (needed for image parts), never both. */
export type StructuredInput =
  { prompt: string; messages?: never } | { messages: ModelMessage[]; prompt?: never }

export type StructuredRequest<S extends z.ZodType> = StructuredInput & {
  model: LanguageModel
  schema: S
  system?: string
  abortSignal?: AbortSignal
  temperature?: number
}

/**
 * One structured model call: `generateText` with `Output.object({ schema })`.
 *
 * ZERO TOOL BINDING (security invariant, ADR-0008): this helper never passes `tools`,
 * `toolChoice` or `activeTools`, so the model cannot call anything. tests/ai/structured.test.ts
 * locks that in.
 *
 * Failures surface as thrown errors: a response that is not JSON or does not match the schema
 * throws `NoObjectGeneratedError` when `.output` is read, a response with no usable text throws
 * `NoOutputGeneratedError`, and transport or abort errors propagate unchanged. The parsed value
 * is checked against the schema once more so the return type is exactly `z.infer<S>`.
 */
export async function generateStructured<S extends z.ZodType>(
  request: StructuredRequest<S>
): Promise<z.infer<S>> {
  const { model, schema, system, abortSignal, temperature } = request
  const input: StructuredInput =
    request.messages !== undefined
      ? { messages: request.messages }
      : { prompt: request.prompt as string }

  const result = await generateText({
    model,
    output: Output.object({ schema }),
    system,
    ...input,
    abortSignal,
    temperature,
  })
  return schema.parse(result.output)
}

export interface StructuredWithRepairRequest<S extends z.ZodType> {
  model: LanguageModel
  schema: S
  system?: string
  /** The first attempt. */
  input: StructuredInput
  /** The one-shot repair attempt. Fixed wording only: never echo validation errors into it. */
  repairInput: StructuredInput
  /** Total budget for both attempts. */
  timeoutMs: number
  /** Temperature of the first attempt. */
  temperature?: number
}

/** Floor for the repair attempt's timeout, even when the first attempt used most of the budget. */
const MIN_REPAIR_TIMEOUT_MS = 2000

/**
 * Extract-then-repair flow shared by the Style, Quote and Layout analysts: one attempt at the
 * given temperature, and on any non-timeout failure a single temperature-0 retry with the
 * remaining time budget (at least 2s). Timeouts and aborts rethrow immediately so the ladder can
 * escalate; a failed repair also throws.
 */
export async function generateStructuredWithRepair<S extends z.ZodType>(
  request: StructuredWithRepairRequest<S>
): Promise<z.infer<S>> {
  const { model, schema, system, input, repairInput, timeoutMs, temperature = 0.2 } = request
  const startTime = Date.now()

  try {
    return await generateStructured({
      model,
      schema,
      system,
      ...input,
      abortSignal: AbortSignal.timeout(timeoutMs),
      temperature,
    })
  } catch (err: unknown) {
    if (isTimeoutOrAbortError(err)) throw err

    const remainingMs = Math.max(MIN_REPAIR_TIMEOUT_MS, timeoutMs - (Date.now() - startTime))
    return generateStructured({
      model,
      schema,
      system,
      ...repairInput,
      abortSignal: AbortSignal.timeout(remainingMs),
      temperature: 0,
    })
  }
}
