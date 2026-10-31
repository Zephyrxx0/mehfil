import type { BudgetCategory } from '@/lib/engine/types'

/** Vendor categories a quote can be checked against, in display order. */
export const INTAKE_CATEGORIES: { id: BudgetCategory; label: string }[] = [
  { id: 'catering', label: 'Catering' },
  { id: 'venue', label: 'Venue' },
  { id: 'decor', label: 'Decor' },
  { id: 'photo_film', label: 'Photo & Film' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'favors', label: 'Favors' },
]
