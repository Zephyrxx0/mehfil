export const PLAN_TABS = [
  { id: 'budget', label: 'Budget' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'style', label: 'Style' },
  { id: 'history', label: 'History' },
] as const

export type PlanTabId = (typeof PLAN_TABS)[number]['id']

export function isPlanTab(value: string | null | undefined): value is PlanTabId {
  return PLAN_TABS.some((t) => t.id === value)
}
