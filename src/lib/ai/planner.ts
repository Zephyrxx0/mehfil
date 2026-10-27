import type { StyleDNA } from './schemas'
import { generateStyleModulationRationale } from '@/lib/engine/style'
import type { BudgetCategory } from '@/lib/engine/types'

export const PLANNER_SYSTEM_PROMPT =
  'You are the Mehfil Planner. You suggest relative category multipliers to capture the aesthetic Style DNA while respecting celebration feasibility. All numbers will be calculated by the deterministic code engine. Multipliers must fall strictly within [0.75, 1.25].'

/**
 * Generates an audited, reassuring plain-language explanation of which categories grew,
 * which trimmed, and confirmation that the Protected Moment held firm at its floor.
 * In accordance with project tenets: "Words from models, numbers from code: language models
 * are structurally banned from generating monetary amounts or dates."
 */
export async function generatePlannerRationale(
  styleDNA: StyleDNA,
  deltas: Array<{ category: string; deltaPaise: number }>
): Promise<string> {
  return generateStyleModulationRationale(
    styleDNA,
    deltas as Array<{ category: BudgetCategory; deltaPaise: number }>
  )
}
