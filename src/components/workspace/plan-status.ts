import type { BudgetCategory, Plan, ShortfallRemedy } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'

/**
 * Knowledge the budget, timeline and shortfall views share. These pieces used to be repeated
 * (or agreed on only by convention) in BudgetLineRow, MilestoneBand and ShortfallBanner, which
 * is why those files kept changing together.
 */

// -- Budget category anchors ------------------------------------------------------------

/**
 * DOM id of a budget category row. BudgetLineRow sets it and MilestoneBand scrolls to it, so
 * both must build it the same way.
 */
export function categoryAnchorId(category: string): string {
  return `category-${category}`
}

/** Scrolls the budget row for `category` into view, if it is on screen. */
export function scrollToCategory(category: string): void {
  const el = document.getElementById(categoryAnchorId(category))
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const CATEGORY_NAMES: Record<BudgetCategory, string> = {
  venue: 'Venue & Stage',
  catering: 'Catering & Meals',
  decor: 'Decor & Flowers',
  photo_film: 'Photography & Film',
  entertainment: 'Entertainment',
  favors: 'Favors & Invites',
  misc: 'Miscellaneous',
  contingency: 'Contingency Cash',
}

/** Display name for a budget category; an unknown category is shown as its raw key. */
export function categoryDisplayName(category: string): string {
  return (CATEGORY_NAMES as Record<string, string | undefined>)[category] || category
}

// -- Flexible-line floors ---------------------------------------------------------------

/**
 * A flexible line is never trimmed below this share of its baseline (D-11, ADR-0002). This
 * mirrors the floor the budget engine applies when it balances the plan.
 */
export const FLOOR_RATIO = 0.4

/** The floor written as a percentage, e.g. "40%", for on-screen copy. */
export const FLOOR_PERCENT_LABEL = `${Math.round(FLOOR_RATIO * 100)}%`

/** The protected floor of a flexible line, rounded to a whole rupee. */
export function elasticFloorPaise(baselinePaise: number): number {
  return Math.round((baselinePaise * FLOOR_RATIO) / 100) * 100
}

// -- Shortfall --------------------------------------------------------------------------

/** The amount the plan is short by, or `undefined` when the plan balances. */
export function activeShortfallPaise(plan: Plan): number | undefined {
  return plan.isInfeasible && plan.shortfallPaise ? plan.shortfallPaise : undefined
}

/** Label for the one-click button of a shortfall remedy. */
export function remedyButtonLabel(remedy: ShortfallRemedy): string {
  switch (remedy.type) {
    case 'increase_budget':
      return `Add ${formatINR(remedy.deltaValue)} to Budget`
    case 'reduce_guests':
      return `Set Guests to ${remedy.deltaValue}`
    case 'trim_elastic':
      return 'Trim Flexible Lines'
    default:
      return 'Apply Remedy'
  }
}

// -- Feedback ---------------------------------------------------------------------------

/** A short haptic pulse on tap, where the device supports it (MOMENT-03, T-05-09). */
export function pulseHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(50)
    } catch {
      // Safe fallback in unsupported or restricted iframe contexts
    }
  }
}
