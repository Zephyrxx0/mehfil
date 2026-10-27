// All financial values are integers in paise (1 rupee = 100 paise)
// NEVER use floating-point for money calculations

export type Paise = number  // always a whole integer
export type Rupees = number // always a whole integer, display only

export type EventType = 'wedding' | 'birthday' | 'community'

export type LineType = 'per_guest' | 'fixed' | 'flexible' | 'buffer'

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photo_film'
  | 'entertainment'
  | 'favors'
  | 'misc'
  | 'contingency'

export interface BudgetLine {
  id: string
  name: string
  category: BudgetCategory
  lineType: LineType
  baselinePaise: Paise        // original allocation from archetype
  currentPaise: Paise         // current allocation (integer paise, mutable)
  elasticityRank?: number     // lower rank = trimmed first (1 = first to trim)
  isProtected?: boolean       // Protected Moment — immune to downward trimming (ADR-0004)
}

export interface EventBrief {
  title: string
  eventType: EventType
  eventDate: string           // ISO date 'YYYY-MM-DD'
  city: string
  guestCount: number          // whole number
  totalBudgetPaise: Paise     // integer paise
  protectedCategory: BudgetCategory
  nuances?: string[]
  customNotes?: string
}

export type ShortfallRemedyType = 'increase_budget' | 'reduce_guests' | 'trim_elastic'

export interface ShortfallRemedy {
  type: ShortfallRemedyType
  title: string
  description: string
  deltaValue: number          // context-dependent: paise for money, guest count for reduce_guests
}

export interface Plan {
  id: string
  brief: EventBrief
  lines: BudgetLine[]
  totalBudgetPaise: Paise     // INVARIANT: sum(lines[].currentPaise) === totalBudgetPaise
  baselineGuestCount: number  // guest count at plan creation (for scaling reference)
  isInfeasible?: boolean      // true when elastic capacity is exhausted
  shortfallPaise?: Paise      // how much is unaccounted for
  remedies?: ShortfallRemedy[]
}
