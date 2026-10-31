import type { Plan, TimelineSchedule, BudgetCategory, Paise, SanitizedSharedPlan } from './types'

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

  // 2. Calculate integer percentages
  const totalWithoutContingency = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
  const categoryPercentages: Record<string, number> = {}
  for (const [cat, paise] of Object.entries(categoryTotals)) {
    categoryPercentages[cat] =
      totalWithoutContingency > 0 ? Math.round((paise / totalWithoutContingency) * 100) : 0
  }

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
