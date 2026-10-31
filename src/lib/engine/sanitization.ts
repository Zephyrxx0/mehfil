import type { Plan, TimelineSchedule, BudgetCategory, Paise, SanitizedSharedPlan } from './types'

/** Tie-break order for equal remainders, so the same totals always give the same percentages. */
const CATEGORY_ORDER: readonly string[] = [
  'venue',
  'catering',
  'decor',
  'photo_film',
  'entertainment',
  'favors',
  'misc',
]

/**
 * Largest-remainder (Hare-Niemeyer) split of 100 percent across categories, in exact integer
 * arithmetic: each share is floor(paise * 100 / total), and the points left over go to the
 * largest remainders, ties broken by CATEGORY_ORDER. The result sums to exactly 100 when
 * `total` is positive, and is all zeros otherwise.
 */
function apportionPercentages(totals: Record<string, Paise>, total: Paise): Record<string, number> {
  const categories = Object.keys(totals)
  const percentages: Record<string, number> = {}
  if (total <= 0) {
    for (const cat of categories) percentages[cat] = 0
    return percentages
  }

  const shares = categories.map((cat) => {
    const scaled = totals[cat] * 100
    const floor = Math.floor(scaled / total)
    return { cat, floor, remainder: scaled - floor * total }
  })

  const orderOf = (cat: string) => {
    const index = CATEGORY_ORDER.indexOf(cat)
    return index === -1 ? CATEGORY_ORDER.length : index
  }
  const byRemainder = [...shares].sort(
    (a, b) => b.remainder - a.remainder || orderOf(a.cat) - orderOf(b.cat)
  )

  let leftover = 100 - shares.reduce((sum, s) => sum + s.floor, 0)
  const bonus = new Set<string>()
  for (const share of byRemainder) {
    if (leftover <= 0) break
    bonus.add(share.cat)
    leftover -= 1
  }

  for (const { cat, floor } of shares) percentages[cat] = floor + (bonus.has(cat) ? 1 : 0)
  return percentages
}

/**
 * Server-side privacy firewall projection for the Family Share view (D-06, PRD §9.5).
 * Strictly removes private vendor quotes, draft notes, elasticity ranks, internal margins,
 * and contingency buffers. Exposes ONLY celebratory aggregates and public ceremonies.
 */
export function sanitizePlanForSharing(
  plan: Plan,
  schedule: TimelineSchedule
): SanitizedSharedPlan {
  // 1. Calculate high-level category totals (whole paise aggregates only)
  // Internal contingency buffer is strictly excluded from public category breakdown
  const categoryTotals: Record<string, Paise> = {}
  for (const line of plan.lines) {
    if (line.category === 'contingency') continue
    categoryTotals[line.category] = (categoryTotals[line.category] || 0) + line.currentPaise
  }

  // 2. Calculate integer percentages that sum to exactly 100 (largest remainder)
  const totalWithoutContingency = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
  const categoryPercentages = apportionPercentages(categoryTotals, totalWithoutContingency)

  // 3. Find Protected Moment display info
  const protectedLine = plan.lines.find(
    (l) => l.isProtected || l.category === plan.brief.protectedCategory
  )
  const protectedMoment = {
    category: plan.brief.protectedCategory,
    name: protectedLine ? protectedLine.name : plan.brief.protectedCategory,
    isProtected: true,
  }

  // 4. Filter timeline milestones: ONLY public celebration ceremonies and milestones within 14 days
  // Vendor booking deadlines, contract signatures, quotes, and payment milestones are strictly excluded
  const publicMilestones: SanitizedSharedPlan['publicMilestones'] = []
  for (const band of schedule.milestoneBands) {
    for (const task of band.tasks) {
      const titleLower = task.title.toLowerCase()
      const isInternalTask =
        titleLower.includes('book') ||
        titleLower.includes('contract') ||
        titleLower.includes('deposit') ||
        titleLower.includes('payment') ||
        titleLower.includes('quote') ||
        titleLower.includes('invoice') ||
        titleLower.includes('negotiat')

      if (!isInternalTask) {
        publicMilestones.push({
          id: task.id,
          title: task.title,
          budgetCategory: task.budgetCategory,
          targetDate: task.targetDate,
          leadDays: task.leadDays,
          isCeremony: task.leadDays <= 2 || task.budgetCategory === 'venue',
        })
      }
    }
  }

  return {
    id: plan.id,
    title: plan.brief.title,
    eventType: plan.brief.eventType,
    eventDate: plan.brief.eventDate,
    city: plan.brief.city,
    guestCount: plan.brief.guestCount,
    totalBudgetPaise: plan.totalBudgetPaise,
    categoryTotals: categoryTotals as Record<BudgetCategory, Paise>,
    categoryPercentages: categoryPercentages as Record<BudgetCategory, number>,
    protectedMoment,
    publicMilestones,
  }
}
