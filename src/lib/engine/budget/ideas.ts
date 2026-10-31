import type { CuratedIdea, DisplacedDonor, IdeaDisplacementRecord, Paise, Plan } from '../types'
import {
  absorbRoundingDrift,
  applyShortfallStatus,
  cloneLines,
  drainDonors,
  flexibleLines,
  inDrainOrder,
} from './shared'

function buildDisplacementRecord(
  idea: CuratedIdea,
  displacedDonors: DisplacedDonor[],
  uncoveredPaise: Paise
): IdeaDisplacementRecord {
  return {
    ideaId: idea.id,
    title: idea.title,
    targetCategory: idea.category,
    costPaise: idea.costPaise,
    displacedDonors,
    shortfallPaise: uncoveredPaise > 0 ? uncoveredPaise : undefined,
    adoptedAt: new Date().toISOString(),
  }
}

/**
 * Adopt a curated celebration idea via zero-sum displacement (IDEA-02, BUDGET-04, ADR-0004).
 * - Target category receives idea.costPaise
 * - Flexible donor lines are drained in strict elasticity order (Misc=1 -> Entertainment=2 -> Decor=3)
 * - Donor lines are never drained below 40% of their baselinePaise (D-11, D-06)
 * - Protected Moment is mathematically immune to displacement (!line.isProtected) (MOMENT-02)
 * - Permissive shortfall: if flexible capacity is exhausted, lines clamp to 40% floor,
 *   plan becomes infeasible with shortfallPaise, and deterministic remedies are computed (D-04, ADR-0002).
 */
export function adoptIdea(plan: Plan, idea: CuratedIdea): Plan {
  const lines = cloneLines(plan)
  const targetLine = lines.find((l) => l.category === idea.category)
  if (!targetLine) {
    throw new Error(`Target category ${idea.category} not found in plan`)
  }

  // Donors: flexible, not protected, and not the target category
  const donorCandidates = inDrainOrder(
    flexibleLines(lines).filter((l) => l.category !== idea.category)
  )
  const { displaced, remainingPaise } = drainDonors(donorCandidates, idea.costPaise)

  // Target category line receives full idea.costPaise (permissive model, D-04)
  targetLine.currentPaise += idea.costPaise

  const record = buildDisplacementRecord(idea, displaced, remainingPaise)
  const newPlan: Plan = {
    ...plan,
    lines,
    adoptedIdeas: [...(plan.adoptedIdeas ?? []), record],
  }

  applyShortfallStatus(newPlan, (plan.shortfallPaise ?? 0) + remainingPaise)

  // Verify invariant for feasible plans
  if (!newPlan.isInfeasible) {
    absorbRoundingDrift(newPlan.lines, newPlan.totalBudgetPaise, donorCandidates[0])
  }

  return newPlan
}

/**
 * Retract an adopted idea via exact inverse reversion (IDEA-03, D-07, ADR-0004).
 * - Debits idea.costPaise from target category
 * - Restores exact recorded displaced paise to donor lines in reverse order
 * - Cleanses shortfall and infeasible status if the idea caused shortfall
 */
export function retractIdea(plan: Plan, ideaId: string): Plan {
  const record = plan.adoptedIdeas?.find((r) => r.ideaId === ideaId)
  if (!record) {
    return plan
  }

  const lines = cloneLines(plan)
  const targetLine = lines.find((l) => l.category === record.targetCategory)
  if (targetLine) {
    targetLine.currentPaise -= record.costPaise
  }

  // Reverse restore displaced paise: iterate record.displacedDonors in reverse order
  for (const donor of [...record.displacedDonors].reverse()) {
    const line = lines.find((l) => l.id === donor.lineId)
    if (line) {
      line.currentPaise += donor.displacedPaise
    }
  }

  const remainingAdoptedIdeas = (plan.adoptedIdeas ?? []).filter((r) => r.ideaId !== ideaId)
  const newPlan: Plan = {
    ...plan,
    lines,
    adoptedIdeas: remainingAdoptedIdeas.length > 0 ? remainingAdoptedIdeas : undefined,
  }

  const ideaShortfall = record.shortfallPaise ?? 0
  applyShortfallStatus(newPlan, Math.max(0, (plan.shortfallPaise ?? 0) - ideaShortfall))

  // Verify invariant for feasible plans
  if (!newPlan.isInfeasible) {
    absorbRoundingDrift(newPlan.lines, newPlan.totalBudgetPaise, flexibleLines(newPlan.lines)[0])
  }

  return newPlan
}
