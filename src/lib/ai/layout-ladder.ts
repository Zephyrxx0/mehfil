import { generateObject, type LanguageModel } from 'ai'
import type { BudgetCategory, Plan } from '@/lib/engine/types'
import { isTimeoutOrAbortError } from './style-analyst'
import { buildGenerativeUISystemPrompt, generateDeterministicLayout } from './layout-heuristic'
import { runLadder, type FallbackLadderOptions } from './ladder'
import { fenceUntrustedText } from './quarantine'
import { GenerativeUILayoutSchema, type AgentRunRecord, type GenerativeUILayout } from './schemas'

export interface LayoutFallbackLadderResult {
  layout: GenerativeUILayout
  runRecord: AgentRunRecord
}

interface LayoutRequest {
  prompt: string
  systemPrompt: string
}

/**
 * Asks a model for a Generative UI layout with a timeout and a one-shot, temperature-0 repair
 * retry (GENUI-01, GENUI-02, ADR-0008). Output is a closed-registry layout of entity ids only.
 * `generateObject` accepts no tools, so the model cannot call anything: zero tool binding holds
 * by construction.
 */
export async function generateLayoutWithModel(
  model: LanguageModel,
  request: LayoutRequest,
  timeoutMs = 8000
): Promise<GenerativeUILayout> {
  const startTime = Date.now()
  const call = (prompt: string, abortMs: number, temperature: number) =>
    generateObject({
      model,
      schema: GenerativeUILayoutSchema,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      abortSignal: AbortSignal.timeout(abortMs),
      temperature,
    })

  try {
    const { object } = await call(request.prompt, timeoutMs, 0.2)
    return GenerativeUILayoutSchema.parse(object)
  } catch (err: unknown) {
    if (isTimeoutOrAbortError(err)) throw err

    const remainingMs = Math.max(2000, timeoutMs - (Date.now() - startTime))
    const repairPrompt = `${request.prompt}\n\nThe previous layout failed schema validation. Remember: NEVER output numeric amounts or dates. Use ONLY entity IDs (lineIds, quoteIds, ideaIds). Output valid JSON matching GenerativeUILayoutSchema.`
    const { object: repaired } = await call(repairPrompt, remainingMs, 0)
    return GenerativeUILayoutSchema.parse(repaired)
  }
}

function summarisePlan(plan: Plan): string {
  const categories = plan.lines.map((l) => `${l.category} (id: ${l.id})`).join(', ')
  const quotes = (plan.quotes ?? [])
    .map((q) => `${q.vendorName} (id: ${q.id}, cat: ${q.category})`)
    .join(', ')
  return `Celebration: ${plan.brief.title} (${plan.brief.eventType}), Guests: ${plan.brief.guestCount}, Categories: ${categories}, Quotes: ${quotes}`
}

/**
 * Layout curation through the three-tier ladder (ADR-0007, ADR-0008, GENUI-03).
 * Plan titles and vendor names come from user and vendor text, so the whole context block and
 * the organizer's request are fenced as data.
 */
export async function generateLayoutWithFallbackLadder(
  plan: Plan,
  prompt: string,
  contextCategory?: BudgetCategory,
  options?: FallbackLadderOptions
): Promise<LayoutFallbackLadderResult> {
  const context = fenceUntrustedText('untrusted_plan_context', summarisePlan(plan))
  const organizerRequest = fenceUntrustedText('organizer_request', prompt)
  const request: LayoutRequest = {
    prompt: `Plan Context:\n${context.text}\n\nOrganizer Request:\n${organizerRequest.text}`,
    systemPrompt: buildGenerativeUISystemPrompt([context.tag, organizerRequest.tag]),
  }

  const { value, runRecord } = await runLadder<GenerativeUILayout>({
    agent: 'layout',
    options,
    callModel: (model, timeoutMs) => generateLayoutWithModel(model, request, timeoutMs),
    deterministic: () => generateDeterministicLayout(plan, contextCategory),
  })
  return { layout: value, runRecord }
}
