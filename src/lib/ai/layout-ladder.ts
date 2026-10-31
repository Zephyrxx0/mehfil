import type { LanguageModel } from 'ai'
import type { BudgetCategory, Plan } from '@/lib/engine/types'
import { buildGenerativeUISystemPrompt, generateDeterministicLayout } from './layout-heuristic'
import { runLadder, type FallbackLadderOptions } from './ladder'
import { fenceUntrustedText } from './quarantine'
import { generateStructuredWithRepair } from './structured'
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
 * `generateStructured` never passes tools, so the model cannot call anything: zero tool binding
 * holds by construction (see structured.ts and tests/ai/structured.test.ts).
 */
async function generateLayoutWithModel(
  model: LanguageModel,
  request: LayoutRequest,
  timeoutMs = 8000
): Promise<GenerativeUILayout> {
  const repairPrompt = `${request.prompt}\n\nThe previous layout failed schema validation. Remember: NEVER output numeric amounts or dates. Use ONLY entity IDs (lineIds, quoteIds, ideaIds). Output valid JSON matching GenerativeUILayoutSchema.`
  const asMessage = (content: string) => ({
    messages: [{ role: 'user' as const, content }],
  })

  return generateStructuredWithRepair({
    model,
    schema: GenerativeUILayoutSchema,
    system: request.systemPrompt,
    input: asMessage(request.prompt),
    repairInput: asMessage(repairPrompt),
    timeoutMs,
  })
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
