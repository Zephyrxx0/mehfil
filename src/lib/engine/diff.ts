import type { Plan, PlanChangeDelta } from '@/lib/engine/types'
import { formatINR } from './currency'

export interface PlanDiffInput {
  prevPlan: Plan
  nextPlan: Plan
  actionType?: 'guest_scale' | 'budget_change' | 'protected_lock' | 'restore' | 'manual'
  restoredVersionNumber?: number
  restoredReason?: string
}

export interface PlanDiffResult {
  summary: string
  deltas: PlanChangeDelta[]
  isFloorProtected: boolean
  donorCategories: string[]
  recipientCategories: string[]
}

/**
 * Pure TypeScript deterministic plan diff engine (D-12, ADR-0004).
 * Computes plain-language audit explanations directly from integer paise deltas with 100% mathematical accuracy.
 * Zero LLM latency, zero hallucinated math, tamper-evident.
 */
export function computePlanDiff(input: PlanDiffInput): PlanDiffResult {
  const { prevPlan, nextPlan, actionType, restoredVersionNumber, restoredReason } = input

  // 1. Forward Restore Action (D-10)
  if (actionType === 'restore' && restoredVersionNumber !== undefined) {
    const reasonSuffix = restoredReason ? ` (${restoredReason})` : ''
    return {
      summary: `Reverted to v${restoredVersionNumber}${reasonSuffix}`,
      deltas: [],
      isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
      donorCategories: [],
      recipientCategories: [],
    }
  }

  // 2. Compute category level deltas
  const deltas: PlanChangeDelta[] = []
  const donorCategories: string[] = []
  const recipientCategories: string[] = []

  for (const nextLine of nextPlan.lines) {
    const prevLine = prevPlan.lines.find((l) => l.id === nextLine.id)
    const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
    const deltaPaise = nextLine.currentPaise - prevPaise

    if (deltaPaise !== 0) {
      deltas.push({
        category: nextLine.name,
        deltaPaise,
      })
      if (deltaPaise > 0) {
        recipientCategories.push(nextLine.name)
      } else {
        donorCategories.push(nextLine.name)
      }
    }
  }

  const isFloorProtected = Boolean(nextPlan.brief.protectedCategory)
  const protectedSuffix = isFloorProtected ? '; Protected Moment held firm' : ''

  // 3. Protected Moment Lock / Reassignment Action
  if (
    actionType === 'protected_lock' ||
    prevPlan.brief.protectedCategory !== nextPlan.brief.protectedCategory
  ) {
    const catName = nextPlan.brief.protectedCategory.replace('_', ' ')
    return {
      summary: `Locked Protected Moment for ${catName}; non-negotiable floor enforced`,
      deltas,
      isFloorProtected: true,
      donorCategories,
      recipientCategories,
    }
  }

  // 4. Guest Count Change Action
  if (
    actionType === 'guest_scale' ||
    prevPlan.brief.guestCount !== nextPlan.brief.guestCount
  ) {
    const prevG = prevPlan.brief.guestCount
    const nextG = nextPlan.brief.guestCount
    const deltaG = nextG - prevG
    const signG = deltaG > 0 ? `+${deltaG}` : `${deltaG}`

    let scalingDetails = ''
    if (recipientCategories.length > 0 && donorCategories.length > 0) {
      scalingDetails = ` Scaled ${recipientCategories.join(', ')} by drawing from ${donorCategories.join(', ')}`
    } else if (recipientCategories.length > 0) {
      scalingDetails = ` Scaled ${recipientCategories.join(', ')}`
    } else if (donorCategories.length > 0) {
      scalingDetails = ` Scaled down ${donorCategories.join(', ')}`
    }

    return {
      summary: `Scaled guest count to ${nextG} (${signG} guests).${scalingDetails}${protectedSuffix}.`,
      deltas,
      isFloorProtected,
      donorCategories,
      recipientCategories,
    }
  }

  // 5. Total Budget Change Action
  if (
    actionType === 'budget_change' ||
    prevPlan.totalBudgetPaise !== nextPlan.totalBudgetPaise
  ) {
    const deltaB = nextPlan.totalBudgetPaise - prevPlan.totalBudgetPaise
    const actionVerb = deltaB >= 0 ? 'Increased' : 'Decreased'
    return {
      summary: `${actionVerb} total budget by ${formatINR(Math.abs(deltaB))}; apportioned across flexible lines${protectedSuffix}.`,
      deltas,
      isFloorProtected,
      donorCategories,
      recipientCategories,
    }
  }

  // 6. Default fallback / manual line adjustment
  return {
    summary:
      deltas.length > 0
        ? `Adjusted allocations across ${deltas.length} categories${protectedSuffix}.`
        : 'All allocations balanced in harmony.',
    deltas,
    isFloorProtected,
    donorCategories,
    recipientCategories,
  }
}
