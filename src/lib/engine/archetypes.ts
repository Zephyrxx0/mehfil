import type { EventType, BudgetLine, BudgetCategory, EventBrief, Plan } from './types'
import { apportionRupees } from './budget'
import { createId } from '@/lib/id'

interface ArchetypeLineTemplate {
  id: string
  name: string
  category: BudgetCategory
  lineType: 'per_guest' | 'fixed' | 'flexible' | 'buffer'
  ratio: number // fraction of total budget (sum of all ratios = 1.0)
  elasticityRank?: number
  isDefaultProtected?: boolean // default Protected Moment for this archetype
}

interface Archetype {
  id: string
  eventType: EventType
  name: string
  defaultGuestCount: number
  defaultBudgetPaise: number // integer paise
  lines: ArchetypeLineTemplate[]
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'indian-wedding',
    eventType: 'wedding',
    name: 'Indian Wedding',
    defaultGuestCount: 300,
    defaultBudgetPaise: 250_000_000, // ₹25,00,000 = 2,500,000 rupees = 250,000,000 paise
    lines: [
      { id: 'venue', name: 'Venue & Stage', category: 'venue', lineType: 'fixed', ratio: 0.3 },
      {
        id: 'catering',
        name: 'Catering & Meals',
        category: 'catering',
        lineType: 'per_guest',
        ratio: 0.35,
        isDefaultProtected: true,
      },
      {
        id: 'decor',
        name: 'Decor & Flowers',
        category: 'decor',
        lineType: 'flexible',
        ratio: 0.12,
        elasticityRank: 3,
      },
      {
        id: 'photo_film',
        name: 'Photography & Film',
        category: 'photo_film',
        lineType: 'fixed',
        ratio: 0.1,
      },
      {
        id: 'entertainment',
        name: 'Entertainment & Music',
        category: 'entertainment',
        lineType: 'flexible',
        ratio: 0.06,
        elasticityRank: 2,
      },
      {
        id: 'favors',
        name: 'Favors & Gifting',
        category: 'favors',
        lineType: 'per_guest',
        ratio: 0.02,
      },
      {
        id: 'misc',
        name: 'Miscellaneous',
        category: 'misc',
        lineType: 'flexible',
        ratio: 0.0,
        elasticityRank: 1,
      },
      {
        id: 'contingency',
        name: 'Contingency Buffer',
        category: 'contingency',
        lineType: 'buffer',
        ratio: 0.05,
      },
    ],
  },
  {
    id: 'milestone-birthday',
    eventType: 'birthday',
    name: 'Milestone Birthday',
    defaultGuestCount: 80,
    defaultBudgetPaise: 50_000_000, // ₹5,00,000 = 500,000 rupees = 50,000,000 paise
    lines: [
      { id: 'venue', name: 'Venue', category: 'venue', lineType: 'fixed', ratio: 0.25 },
      {
        id: 'catering',
        name: 'Catering & Food',
        category: 'catering',
        lineType: 'per_guest',
        ratio: 0.4,
      },
      {
        id: 'decor',
        name: 'Decor & Styling',
        category: 'decor',
        lineType: 'flexible',
        ratio: 0.15,
        elasticityRank: 3,
      },
      {
        id: 'photo_film',
        name: 'Photography',
        category: 'photo_film',
        lineType: 'fixed',
        ratio: 0.1,
        isDefaultProtected: true,
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        category: 'entertainment',
        lineType: 'flexible',
        ratio: 0.05,
        elasticityRank: 2,
      },
      {
        id: 'favors',
        name: 'Favors & Return Gifts',
        category: 'favors',
        lineType: 'per_guest',
        ratio: 0.03,
      },
      {
        id: 'misc',
        name: 'Miscellaneous',
        category: 'misc',
        lineType: 'flexible',
        ratio: 0.0,
        elasticityRank: 1,
      },
      {
        id: 'contingency',
        name: 'Contingency Buffer',
        category: 'contingency',
        lineType: 'buffer',
        ratio: 0.02,
      },
    ],
  },
  {
    id: 'community-cultural',
    eventType: 'community',
    name: 'Community Cultural Meet',
    defaultGuestCount: 200,
    defaultBudgetPaise: 80_000_000, // ₹8,00,000 = 800,000 rupees = 80,000,000 paise
    lines: [
      {
        id: 'venue',
        name: 'Community Hall & Setup',
        category: 'venue',
        lineType: 'fixed',
        ratio: 0.35,
      },
      {
        id: 'catering',
        name: 'Catering & Refreshments',
        category: 'catering',
        lineType: 'per_guest',
        ratio: 0.3,
      },
      {
        id: 'decor',
        name: 'Decor & Stage',
        category: 'decor',
        lineType: 'flexible',
        ratio: 0.1,
        elasticityRank: 3,
      },
      {
        id: 'photo_film',
        name: 'Photography & AV',
        category: 'photo_film',
        lineType: 'fixed',
        ratio: 0.08,
      },
      {
        id: 'entertainment',
        name: 'Cultural Entertainment',
        category: 'entertainment',
        lineType: 'flexible',
        ratio: 0.1,
        elasticityRank: 2,
        isDefaultProtected: true,
      },
      {
        id: 'favors',
        name: 'Favors & Mementos',
        category: 'favors',
        lineType: 'per_guest',
        ratio: 0.02,
      },
      {
        id: 'misc',
        name: 'Miscellaneous',
        category: 'misc',
        lineType: 'flexible',
        ratio: 0.0,
        elasticityRank: 1,
      },
      {
        id: 'contingency',
        name: 'Contingency Buffer',
        category: 'contingency',
        lineType: 'buffer',
        ratio: 0.05,
      },
    ],
  },
]

/**
 * Instantiate a Plan from an EventBrief using the matching archetype.
 * Must complete in <10ms (pure synchronous computation, ADR-0001).
 */
export function instantiatePlanFromBrief(brief: EventBrief): Plan {
  const archetype = ARCHETYPES.find((a) => a.eventType === brief.eventType)
  if (!archetype) {
    throw new Error(`No archetype found for event type: ${brief.eventType}`)
  }

  const ratios = archetype.lines.map((l) => l.ratio)
  const allocations = apportionRupees(brief.totalBudgetPaise, ratios)

  const lines: BudgetLine[] = archetype.lines.map((template, i) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    lineType: template.lineType,
    baselinePaise: allocations[i],
    currentPaise: allocations[i],
    elasticityRank: template.elasticityRank,
    isProtected: template.category === brief.protectedCategory,
  }))

  return {
    id: createId(brief.eventType),
    brief,
    lines,
    totalBudgetPaise: brief.totalBudgetPaise,
    baselineGuestCount: brief.guestCount,
  }
}
