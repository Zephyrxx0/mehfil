import type { BudgetCategory } from '@/lib/engine/types'

/** Display names for budget categories as shown on vendor quote cards. */
export const CATEGORY_NAMES: Record<BudgetCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decor',
  photo_film: 'Photo & Film',
  entertainment: 'Entertainment',
  favors: 'Favors',
  misc: 'Miscellaneous',
  contingency: 'Contingency',
}
