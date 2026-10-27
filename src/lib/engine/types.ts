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

// Timeline Domain Types (D-13, D-14, D-16, TIME-01)
export type MilestoneBandId =
  | 'milestone_immediate'
  | 'milestone_t6m'
  | 'milestone_t3m'
  | 'milestone_t1m'
  | 'milestone_t2w'
  | 'milestone_day0'

export interface TimelineTask {
  id: string
  title: string
  budgetCategory: BudgetCategory
  leadDays: number            // days before event (e.g. 180 for T-6M)
  targetDate: string          // ISO date 'YYYY-MM-DD'
  isCompleted: boolean
  isCriticalPath: boolean
  dependencies?: string[]
  notes?: string
}

export interface MilestoneBand {
  id: MilestoneBandId
  name: string
  targetDate: string          // ISO date 'YYYY-MM-DD'
  isImmediateAction?: boolean
  tasks: TimelineTask[]
}

export interface TimelineSchedule {
  eventDate: string
  milestoneBands: MilestoneBand[]
  isCompressedMode: boolean
}

// Collaboration & Versioning Domain Types (Phase 3: COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-04)

export interface PlanChangeDelta {
  category: string
  deltaPaise: Paise
}

export interface ChangeRecord {
  id: string
  planVersionId: string
  deltas: PlanChangeDelta[]
  explanation: string
  isFloorProtected: boolean
  createdAt: string
}

export interface PlanVersionRecord {
  id: string
  eventId: string
  versionNumber: number
  parentVersionId?: string | null
  reason: string
  createdAt: string
  snapshot: Plan
  isFloorProtected?: boolean
  isAccepted?: boolean
}

export interface SanitizedSharedPlan {
  id: string
  title: string
  eventType: EventType
  eventDate: string
  city: string
  guestCount: number
  totalBudgetPaise: Paise
  categoryTotals: Record<BudgetCategory, Paise>
  categoryPercentages: Record<BudgetCategory, number>
  protectedMoment: {
    category: BudgetCategory
    name: string
    isProtected: boolean
  }
  publicMilestones: Array<{
    id: string
    title: string
    budgetCategory: BudgetCategory
    targetDate: string
    leadDays: number
    isCeremony: boolean
  }>
  isExpired?: boolean
}


