# Phase 05: Budget Invariants, Protected Moments & Idea Displacement — Code Patterns & Analog Mappings

**Phase:** 05 - Budget Invariants, Protected Moments & Idea Displacement  
**Authoritative Specs:** `05-CONTEXT.md`, `05-RESEARCH.md`, `DESIGN.md`, `PRD.md`, `docs/adr/0001-deterministic-baseline-first.md`, `docs/adr/0002-permissive-shortfall-with-remedies.md`, `docs/adr/0004-idea-displacement-with-protected-immunity.md`, `docs/adr/0005-compressed-mode-timeline-triage.md`  
**Status:** Complete & Ready for Planning  

---

## 1. Executive Architecture & Flow Mapping

Phase 5 operationalizes Mehfil's dynamic mathematical core: zero-sum idea displacement, Protected Moment mathematical immunity with Gulabi Rose tactile/visual highlights, permissive shortfall handling with 3 deterministic remedies, and environmental date risk intelligence (Saya season, monsoon hazard, holiday clashes) with dynamic lead-time buffers.

### System Data Flow Architecture

```
                                  [Organizer Interaction]
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       │                     │                     │
                       ▼                     ▼                     ▼
               Adopt Curated Idea      Scale Guests /        Set Protected
               (Toggle ON / OFF)       Budget Sliders        Moment Star/Lock
                       │                     │                     │
                       ▼                     │                     │
            src/lib/engine/budget.ts         │                     │
            ├── adoptIdea()                  │                     │
            │   └── Elasticity Drain Order   │                     │
            │       (Misc -> Ent -> Decor)   │                     │
            │       40% Floor Clamping       │                     │
            │       Protected Moment Immune  │                     │
            ├── retractIdea()                │                     │
            │   └── Exact Reverse Reversion  │                     │
            └── applyTrimElasticRemedy()     │                     │
                └── Sequential Deficit Trim  │                     │
                       │                     │                     │
                       └─────────────────────┼─────────────────────┘
                                             │
                                             ▼
                                     Infeasible State?
                                      /            \
                                    YES             NO
                                    /                \
                       ┌───────────┴──────────┐       └──────────────┐
                       ▼                      ▼                      ▼
               ShortfallBanner.tsx    Persist Non-Blocking     sum(lines) ===
               (3 Deterministic       (is_infeasible: true,    totalBudgetPaise
                Remedies + 1-Click    calm advisory pill)      Feasible Invariant
                Atomic Apply)                 │
                       │                      │
                       └──────────────────────┼──────────────────────┘
                                              │
                                              ▼
                             src/lib/engine/diff.ts (computePlanDiff)
                             ├── Plain-language diff sentence
                             └── Version recorded in PlanVersionRecord
                                              │
                                              ▼
                             src/components/workspace/UndoActionBar.tsx
                             └── Tier 1 Instant Undo Pill (8s auto-dismiss)

                                              │
                                              ▼
                                 [Calendar & Timeline Engine]
                                              │
                             src/lib/engine/environmental.ts
                             ├── detectEnvironmentalRisks(date, city, type)
                             │   ├── Peak Winter Saya (Nov-Feb): +30d buffer
                             │   ├── Peak Summer Saya (Apr-May): +15d buffer
                             │   ├── Monsoon Outdoor (Jun-Aug): Shamiana advisory
                             │   ├── Extreme Heat (May-Jun): Hydration advisory
                             │   └── Holiday / Dry Clashes (Jan 26, Aug 15, Oct 2)
                             │
                             ▼
                             src/lib/engine/timeline.ts (calculateBackwardsTimeline)
                             ├── Dynamic milestone lead-time expansion
                             └── Short-notice milestone triage (Compressed Mode)
                                              │
                                              ▼
                             src/components/workspace/TimelineSection.tsx
                             ├── SeasonalAdvisoryBanner.tsx (Ambient alert)
                             └── MilestoneBand.tsx ("+30d peak buffer" badges)
```

---

## 2. Complete Inventory of Files: Created & Modified

| File Path | Role | Data Flow | Closest Analog in Repo |
| :--- | :--- | :--- | :--- |
| `src/lib/engine/types.ts` (MODIFIED) | Domain Types | Extended data contracts for ideas, displacements, environmental risks | Existing [`src/lib/engine/types.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/types.ts) |
| `src/lib/engine/budget.ts` (MODIFIED) | Math Engine | `adoptIdea`, `retractIdea`, `applyTrimElasticRemedy` | Existing [`src/lib/engine/budget.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/budget.ts) |
| `src/lib/engine/archetypes.ts` (MODIFIED) | Archetype Config | Standardize `elasticityRank` (Misc=1, Ent=2, Decor=3) across archetypes | Existing [`src/lib/engine/archetypes.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/archetypes.ts) |
| `src/lib/engine/environmental.ts` (CREATED) | Calendar Engine | `detectEnvironmentalRisks` pure UTC date & risk calculation | [`src/lib/engine/timeline.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/timeline.ts) |
| `src/lib/engine/timeline.ts` (MODIFIED) | Timeline Engine | Dynamic lead-time expansion (+30d Saya buffer) & idea milestone injection | Existing [`src/lib/engine/timeline.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/timeline.ts) |
| `src/lib/engine/diff.ts` (MODIFIED) | Audit Engine | Plain-language sentences for idea adoption, retraction, and remedies | Existing [`src/lib/engine/diff.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/diff.ts) |
| `src/data/curatedIdeas.ts` (CREATED) | Data Catalog | 14–18 authentic Indian celebration ideas + `getPersonalizedIdeas` | [`src/lib/engine/archetypes.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/archetypes.ts) & [`src/lib/engine/style.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/style.ts) |
| `src/components/workspace/CuratedIdeaCard.tsx` (CREATED) | UI Component | Idea display, toggle switch, donor impact preview, micro-haptics | [`src/components/workspace/BudgetLineCard.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/BudgetLineCard.tsx) |
| `src/components/workspace/CuratedIdeasSection.tsx` (CREATED) | UI Section | Category filter chips, idea grid, displacement tally summary | [`src/components/workspace/BudgetSection.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/BudgetSection.tsx) |
| `src/components/workspace/BudgetLineCard.tsx` (MODIFIED) | UI Component | Inline donor tags, Gulabi Rose shimmer, immunity badge & micro-haptics | Existing [`src/components/workspace/BudgetLineCard.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/BudgetLineCard.tsx) |
| `src/components/workspace/ShortfallBanner.tsx` (MODIFIED) | UI Component | Permissive Infeasible State banner with 1-click atomic remedy execution | Existing [`src/components/workspace/ShortfallBanner.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/ShortfallBanner.tsx) |
| `src/components/workspace/SeasonalAdvisoryBanner.tsx` (CREATED) | UI Component | Ambient seasonal banner atop Timeline (Saya season, monsoon, heat) | [`src/components/workspace/ConcurrencyConflictBanner.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/ConcurrencyConflictBanner.tsx) |
| `src/components/workspace/MilestoneBand.tsx` (MODIFIED) | UI Component | `+30d peak buffer` badges and contextual task risk pills | Existing [`src/components/workspace/MilestoneBand.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/MilestoneBand.tsx) |
| `src/components/workspace/UndoActionBar.tsx` (CREATED) | UI Component | Floating bottom action bar (Tier 1 instant 8s undo pill) | [`src/components/workspace/V2ChangeBanner.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/V2ChangeBanner.tsx) |
| `src/components/workspace/TimelineSection.tsx` (MODIFIED) | UI Section | Mount `SeasonalAdvisoryBanner` and calm Compressed Mode styling | Existing [`src/components/workspace/TimelineSection.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/TimelineSection.tsx) |
| `src/components/workspace/WorkspaceShell.tsx` (MODIFIED) | Layout Shell | Add "Curated Ideas" nav tab on desktop & mobile, mount `UndoActionBar` | Existing [`src/components/workspace/WorkspaceShell.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/WorkspaceShell.tsx) |
| `src/components/workspace/PlanWorkspace.tsx` (MODIFIED) | Root Coordinator | Dispatches `handleAdoptIdea`, `handleRetractIdea`, `handleApplyRemedy`, and undo | Existing [`src/components/workspace/PlanWorkspace.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/PlanWorkspace.tsx) |
| `tests/engine/budget.test.ts` (MODIFIED) | Engine Tests | Unit tests for displacement, exact reversion, floor clamping, immunity | Existing [`tests/engine/budget.test.ts`](file:///home/zeph/Code/mehfil/tests/engine/budget.test.ts) |
| `tests/engine/environmental.test.ts` (CREATED) | Engine Tests | Unit tests for Saya dates, monsoon windows, heat alerts, +30d buffer | [`tests/engine/timeline.test.ts`](file:///home/zeph/Code/mehfil/tests/engine/timeline.test.ts) |
| `tests/engine/diff.test.ts` (MODIFIED) | Engine Tests | Diff sentences for idea adoption, retraction, and shortfall remedies | Existing [`tests/engine/diff.test.ts`](file:///home/zeph/Code/mehfil/tests/engine/diff.test.ts) |
| `tests/components/CuratedIdeasSection.test.tsx` (CREATED) | Component Tests | Tests for idea filtering, toggling, donor previews, and adoption states | [`tests/components/PlanWorkspace.test.tsx`](file:///home/zeph/Code/mehfil/tests/components/PlanWorkspace.test.tsx) |
| `tests/components/ShortfallBanner.test.tsx` (CREATED) | Component Tests | Tests for 1-click remedy callback invocation with exact deltas | [`tests/components/ChangeExplainer.test.tsx`](file:///home/zeph/Code/mehfil/tests/components/ChangeExplainer.test.tsx) |
| `tests/components/UndoActionBar.test.tsx` (CREATED) | Component Tests | Tests for 8s timer countdown, manual click, and action dismissal | [`tests/components/SyncStatusBadge.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/SyncStatusBadge.tsx) |

---

## 3. Pattern Specifications: Engine & Mathematical Contracts

### 3.1 Extended Type Contracts: `src/lib/engine/types.ts`

- **Role:** Central domain type registry.
- **Closest Analog:** Existing [`src/lib/engine/types.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/types.ts).
- **Key Invariants:**
  1. `Paise` remains integer throughout all idea costs and donor deductions.
  2. `DisplacedDonor` records exact line ID, category, and deducted paise for 100% loss-free reverse restoration.
  3. `Plan.adoptedIdeas` stores chronological adoption records.
- **Concrete Code Blueprint:**
  ```ts
  // Additions to src/lib/engine/types.ts

  export interface DisplacedDonor {
    lineId: string
    category: BudgetCategory
    displacedPaise: Paise
  }

  export interface IdeaDisplacementRecord {
    ideaId: string
    title: string
    targetCategory: BudgetCategory
    costPaise: Paise
    displacedDonors: DisplacedDonor[]
    shortfallPaise?: Paise // if flexible donor capacity was exhausted
    adoptedAt: string // ISO timestamp
  }

  export interface CuratedIdea {
    id: string
    title: string
    devanagariTitle?: string
    tagline: string
    description: string
    category: BudgetCategory
    eventTypes: EventType[]
    costPaise: Paise
    leadDays: number
    styleTags: string[]
    culturalNuance: string
    timelineTask?: {
      title: string
      notes: string
    }
  }

  export type EnvironmentalRiskId =
    | 'peak_saya_winter'
    | 'peak_saya_summer'
    | 'monsoon_outdoor'
    | 'extreme_summer_heat'
    | 'holiday_clash'

  export interface EnvironmentalRiskAdvisory {
    id: EnvironmentalRiskId
    title: string
    severity: 'advisory' | 'warning'
    description: string
    affectedCategories: BudgetCategory[]
    leadTimeBufferDays?: number
    recommendation: string
  }

  export interface EnvironmentalAnalysis {
    detectedRisks: EnvironmentalRiskAdvisory[]
    isPeakSayaSeason: boolean
    hasWeatherHazards: boolean
    hasHolidayClash: boolean
    seasonalSummaryTitle: string
    seasonalSummaryText: string
  }

  // Extend Plan interface
  export interface Plan {
    id: string
    brief: EventBrief
    lines: BudgetLine[]
    totalBudgetPaise: Paise
    baselineGuestCount: number
    isInfeasible?: boolean
    shortfallPaise?: Paise
    remedies?: ShortfallRemedy[]
    styleDNA?: StyleDNA
    adoptedIdeas?: IdeaDisplacementRecord[]
    environmentalAnalysis?: EnvironmentalAnalysis
  }

  // Extend TimelineTask interface
  export interface TimelineTask {
    id: string
    title: string
    budgetCategory: BudgetCategory
    leadDays: number
    targetDate: string
    isCompleted: boolean
    isCriticalPath: boolean
    dependencies?: string[]
    notes?: string
    appliedBufferDays?: number
    environmentalRiskId?: EnvironmentalRiskId
    environmentalAdvisory?: string
    originIdeaId?: string
  }
  ```

---

### 3.2 Mathematical Budget Engine: `src/lib/engine/budget.ts`

- **Role:** Pure TypeScript implementation of zero-sum displacement, exact inverse reversion, and targeted sequential trimming.
- **Closest Analog:** Existing [`src/lib/engine/budget.ts:62-161`](file:///home/zeph/Code/mehfil/src/lib/engine/budget.ts#L62-L161).
- **Key Invariants:**
  1. **Strict Elasticity Order (BUDGET-04):** Flexible lines absorb displacement in rank order (Misc $\rightarrow$ Entertainment $\rightarrow$ Decor). Lowest rank is drained first down to 40% floor before the next rank is touched.
  2. **Protected Moment Inviolability (MOMENT-02, ADR-0004):** Lines with `isProtected === true` are strictly filtered out of donor selection (`!l.isProtected`).
  3. **Permissive Shortfall Handling (ADR-0002, D-04):** If idea cost exceeds available donor headroom across all flexible lines, clamp all flexible lines to their 40% floor, credit the target category line fully, set `isInfeasible = true`, compute `shortfallPaise`, and calculate deterministic remedies.
  4. **Exact Inverse Reversion (IDEA-03, D-07):** Retracting an idea restores the exact recorded paise to each donor line in reverse order.
  5. **Targeted Sequential Trim (BUDGET-04, D-15):** Remedy 3 trims flexible lines in elasticity order only until the exact deficit is satisfied, leaving unaffected flexible capacity intact.
- **Concrete Code Blueprint:**
  ```ts
  import type {
    Paise,
    Plan,
    BudgetLine,
    BudgetCategory,
    ShortfallRemedy,
    CuratedIdea,
    IdeaDisplacementRecord,
    DisplacedDonor,
  } from './types'

  /**
   * Adopt a curated celebration idea with zero-sum displacement.
   * Funds are drained from flexible lines in strict elasticityRank order (Misc -> Entertainment -> Decor),
   * respecting 40% baseline floors and Protected Moment immunity.
   */
  export function adoptIdea(plan: Plan, idea: CuratedIdea): Plan {
    // 1. Shallow copy lines
    const lines = plan.lines.map((l) => ({ ...l }))
    const targetLine = lines.find((l) => l.category === idea.category)
    if (!targetLine) {
      throw new Error(`Target category line not found: ${idea.category}`)
    }

    // 2. Identify available flexible donor lines (excluding Protected Moment and target category)
    const donorCandidates = lines
      .filter((l) => l.lineType === 'flexible' && !l.isProtected && l.category !== idea.category)
      .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

    let neededPaise = idea.costPaise
    const displacedDonors: DisplacedDonor[] = []

    // 3. Sequentially drain capacity in strict elasticity rank order
    for (const donor of donorCandidates) {
      if (neededPaise <= 0) break

      const floorPaise = Math.round((donor.baselinePaise * 0.40) / 100) * 100
      const availableHeadroom = Math.max(0, donor.currentPaise - floorPaise)

      if (availableHeadroom > 0) {
        const drainAmount = Math.min(neededPaise, availableHeadroom)
        donor.currentPaise -= drainAmount
        neededPaise -= drainAmount

        displacedDonors.push({
          lineId: donor.id,
          category: donor.category,
          displacedPaise: drainAmount,
        })
      }
    }

    // 4. Target line always receives full allocation (permissive model, D-04)
    targetLine.currentPaise += idea.costPaise

    // 5. Build adoption record
    const record: IdeaDisplacementRecord = {
      ideaId: idea.id,
      title: idea.title,
      targetCategory: idea.category,
      costPaise: idea.costPaise,
      displacedDonors,
      shortfallPaise: neededPaise > 0 ? neededPaise : undefined,
      adoptedAt: new Date().toISOString(),
    }

    const updatedAdoptedIdeas = [...(plan.adoptedIdeas || []), record]

    // 6. Check Feasibility
    const newPlan: Plan = {
      ...plan,
      lines,
      adoptedIdeas: updatedAdoptedIdeas,
    }

    if (neededPaise > 0) {
      const existingShortfall = plan.shortfallPaise || 0
      const totalShortfall = existingShortfall + neededPaise
      newPlan.isInfeasible = true
      newPlan.shortfallPaise = totalShortfall
      newPlan.remedies = calculateShortfallRemedies(newPlan, totalShortfall)
    } else if (plan.isInfeasible && plan.shortfallPaise) {
      // Retain existing shortfall if already infeasible
      newPlan.isInfeasible = true
      newPlan.shortfallPaise = plan.shortfallPaise
      newPlan.remedies = calculateShortfallRemedies(newPlan, plan.shortfallPaise)
    } else {
      newPlan.isInfeasible = false
      newPlan.shortfallPaise = undefined
      newPlan.remedies = undefined
    }

    return newPlan
  }

  /**
   * Retract an adopted idea with exact inverse reversion (IDEA-03, D-07).
   * Restores exact paise amounts to the specific donor lines in reverse order.
   */
  export function retractIdea(plan: Plan, ideaId: string): Plan {
    const adoptionRecord = plan.adoptedIdeas?.find((r) => r.ideaId === ideaId)
    if (!adoptionRecord) return plan

    const lines = plan.lines.map((l) => ({ ...l }))
    const targetLine = lines.find((l) => l.category === adoptionRecord.targetCategory)
    if (targetLine) {
      targetLine.currentPaise = Math.max(0, targetLine.currentPaise - adoptionRecord.costPaise)
    }

    // Reverse restore exact paise to donors in reverse order
    const reversedDonors = [...adoptionRecord.displacedDonors].reverse()
    for (const donor of reversedDonors) {
      const line = lines.find((l) => l.id === donor.lineId)
      if (line) {
        line.currentPaise += donor.displacedPaise
      }
    }

    const updatedAdoptedIdeas = plan.adoptedIdeas?.filter((r) => r.ideaId !== ideaId) || []

    let updatedShortfall = plan.shortfallPaise || 0
    if (adoptionRecord.shortfallPaise) {
      updatedShortfall = Math.max(0, updatedShortfall - adoptionRecord.shortfallPaise)
    }

    const newPlan: Plan = {
      ...plan,
      lines,
      adoptedIdeas: updatedAdoptedIdeas,
    }

    if (updatedShortfall > 0) {
      newPlan.isInfeasible = true
      newPlan.shortfallPaise = updatedShortfall
      newPlan.remedies = calculateShortfallRemedies(newPlan, updatedShortfall)
    } else {
      newPlan.isInfeasible = false
      newPlan.shortfallPaise = undefined
      newPlan.remedies = undefined
    }

    return newPlan
  }

  /**
   * Targeted Sequential Trim Remedy (Remedy 3, BUDGET-04, D-15).
   * Trims flexible lines in strict elasticity order ONLY until deficitPaise is covered.
   */
  export function applyTrimElasticRemedy(plan: Plan, deficitPaise: Paise): Plan {
    const lines = plan.lines.map((l) => ({ ...l }))
    const elasticLines = lines
      .filter((l) => l.lineType === 'flexible' && !l.isProtected)
      .sort((a, b) => (a.elasticityRank ?? 99) - (b.elasticityRank ?? 99))

    let remainingDeficit = deficitPaise

    for (const line of elasticLines) {
      if (remainingDeficit <= 0) break
      const floorPaise = Math.round((line.baselinePaise * 0.40) / 100) * 100
      const available = Math.max(0, line.currentPaise - floorPaise)

      if (available > 0) {
        const trimAmount = Math.min(remainingDeficit, available)
        line.currentPaise -= trimAmount
        remainingDeficit -= trimAmount
      }
    }

    const newPlan: Plan = {
      ...plan,
      lines,
    }

    if (remainingDeficit > 0) {
      newPlan.isInfeasible = true
      newPlan.shortfallPaise = remainingDeficit
      newPlan.remedies = calculateShortfallRemedies(newPlan, remainingDeficit)
    } else {
      newPlan.isInfeasible = false
      newPlan.shortfallPaise = undefined
      newPlan.remedies = undefined
    }

    return newPlan
  }
  ```

---

### 3.3 Environmental Date Risk Engine: `src/lib/engine/environmental.ts`

- **Role:** Pure UTC date calculations for Indian celebration seasons, weather hazards, and dynamic lead-time buffers.
- **Closest Analog:** Pure UTC math in [`src/lib/engine/timeline.ts:151-160`](file:///home/zeph/Code/mehfil/src/lib/engine/timeline.ts#L151-L160).
- **Key Invariants:**
  1. All calculations use pure UTC Date methods (`getUTCMonth()`, `getUTCDate()`, `split('-')`). Zero local browser timezone offset bugs.
  2. Peak Saya dates trigger +30d buffer on Venue and Photography milestones.
  3. Tone must be calm and celebratory—never alarmist (ADR-0005, DESIGN.md).
- **Concrete Code Blueprint:**
  ```ts
  import type {
    EventType,
    EnvironmentalAnalysis,
    EnvironmentalRiskAdvisory,
  } from './types'

  /**
   * Evaluates event date, city, and event type for Indian environmental celebration risks (TIME-02, TIME-03).
   * Pure UTC arithmetic, zero external calendar dependencies.
   */
  export function detectEnvironmentalRisks(
    eventDateStr: string,
    city: string,
    eventType: EventType
  ): EnvironmentalAnalysis {
    const [year, month, day] = eventDateStr.split('-').map(Number)
    // UTC month is 0-indexed: Jan=0, Feb=1, ..., Nov=10, Dec=11
    const m = month - 1
    const cityName = city.trim().toLowerCase()

    const detectedRisks: EnvironmentalRiskAdvisory[] = []

    // 1. Peak Winter Saya (Nov 1 – Feb 28)
    // High wedding density across India; venue & photo teams book 8+ months out
    const isWinterSaya = m === 10 || m === 11 || m === 0 || m === 1
    if (eventType === 'wedding' && isWinterSaya) {
      detectedRisks.push({
        id: 'peak_saya_winter',
        title: 'Peak Winter Saya Season',
        severity: 'advisory',
        description: 'Auspicious Muhurat dates create severe demand density across venues and cinematography teams.',
        affectedCategories: ['venue', 'photo_film'],
        leadTimeBufferDays: 30,
        recommendation: 'Lock venue contracts and lead visual team 7–8 months in advance (+30d buffer active).',
      })
    }

    // 2. Peak Summer Saya (Apr 15 – May 31)
    const isSummerSaya = (m === 3 && day >= 15) || m === 4
    if (eventType === 'wedding' && isSummerSaya) {
      detectedRisks.push({
        id: 'peak_saya_summer',
        title: 'Summer Saya Season',
        severity: 'advisory',
        description: 'High banquet demand for climate-controlled indoor spaces during peak auspicious summer dates.',
        affectedCategories: ['venue'],
        leadTimeBufferDays: 15,
        recommendation: 'Secure indoor air-conditioned banquet spaces with generator backup (+15d buffer active).',
      })
    }

    // 3. Monsoon Outdoor Hazard (Jun 15 – Aug 31 / Sep 15 for West Coast)
    const isMonsoonCore = (m === 5 && day >= 15) || m === 6 || m === 7
    const isWestCoast = ['mumbai', 'goa', 'kochi', 'kerala', 'pune'].some((c) => cityName.includes(c))
    const isWestMonsoonExtended = isWestCoast && m === 8 && day <= 15
    const isMonsoonRisk = isMonsoonCore || isWestMonsoonExtended

    if (isMonsoonRisk) {
      detectedRisks.push({
        id: 'monsoon_outdoor',
        title: 'Monsoon Weather Advisory',
        severity: 'warning',
        description: 'High rainfall and humidity risk for open-air celebration lawns.',
        affectedCategories: ['venue', 'decor'],
        recommendation: 'Ensure covered shamiana waterproof staging, covered dining backup, and raised electrical conduits.',
      })
    }

    // 4. Extreme Summer Heat (May 1 – Jun 30)
    const isNorthOrCentral = ['delhi', 'jaipur', 'jodhpur', 'udaipur', 'lucknow', 'ahmedabad', 'chandigarh'].some((c) =>
      cityName.includes(c)
    )
    const isExtremeHeat = (m === 4 || m === 5) && isNorthOrCentral

    if (isExtremeHeat) {
      detectedRisks.push({
        id: 'extreme_summer_heat',
        title: 'High Summer Heat Advisory',
        severity: 'advisory',
        description: 'Temperatures consistently exceed 38–42°C during afternoon hours.',
        affectedCategories: ['catering', 'decor', 'venue'],
        recommendation: 'Schedule ceremonies post-sunset (after 6:30 PM), arrange misting fans, and set chilled thandai / coconut hydration counters.',
      })
    }

    // 5. Fixed Holiday & Dry Day Clashes
    // Jan 26 (Republic Day), Aug 15 (Independence Day), Oct 2 (Gandhi Jayanti), Dec 31 (New Year's Eve)
    const isDryHoliday =
      (m === 0 && day === 26) ||
      (m === 7 && day === 15) ||
      (m === 9 && day === 2) ||
      (m === 11 && day === 31)

    if (isDryHoliday) {
      const holidayLabel =
        m === 0 ? 'Republic Day' : m === 7 ? 'Independence Day' : m === 9 ? 'Gandhi Jayanti' : "New Year's Eve"
      detectedRisks.push({
        id: 'holiday_clash',
        title: `National Holiday / Sound Restriction (${holidayLabel})`,
        severity: 'warning',
        description: 'Strict police sound limits past 10 PM, transport VIP diversions, and dry day alcohol regulations apply.',
        affectedCategories: ['entertainment', 'venue'],
        recommendation: 'Verify sound permits with venue administration and arrange vendor logistics around road closures.',
      })
    }

    const isPeakSayaSeason = detectedRisks.some(
      (r) => r.id === 'peak_saya_winter' || r.id === 'peak_saya_summer'
    )
    const hasWeatherHazards = detectedRisks.some(
      (r) => r.id === 'monsoon_outdoor' || r.id === 'extreme_summer_heat'
    )
    const hasHolidayClash = detectedRisks.some((r) => r.id === 'holiday_clash')

    let summaryTitle = 'Seasonal Celebration Intelligence'
    let summaryText = 'Standard celebration window with normal vendor booking lead times.'

    if (isPeakSayaSeason) {
      summaryTitle = 'Peak Saya Season Active'
      summaryText = `Celebration date coincides with auspicious Muhurat dates in ${city}. Lead times for venue and visual teams have been buffered (+30d).`
    } else if (hasWeatherHazards) {
      summaryTitle = 'Seasonal Weather Notice'
      summaryText = `Outdoor and climate considerations active for ${city}. Review staging and covered backup recommendations.`
    }

    return {
      detectedRisks,
      isPeakSayaSeason,
      hasWeatherHazards,
      hasHolidayClash,
      seasonalSummaryTitle: summaryTitle,
      seasonalSummaryText: summaryText,
    }
  }
  ```

---

### 3.4 Authentic Curated Ideas Catalog: `src/data/curatedIdeas.ts`

- **Role:** Static catalog of 14–18 culturally authentic celebration enhancements with Style DNA dimension affinity ranking.
- **Closest Analog:** Archetype definitions in [`src/lib/engine/archetypes.ts`](file:///home/zeph/Code/mehfil/src/lib/engine/archetypes.ts).
- **Key Invariants:**
  1. All costs in integer paise (`15_000_00` for ₹15,000).
  2. Includes Devanagari titles, lead times, cultural nuance notes, and custom timeline tasks.
  3. `getPersonalizedIdeas` sorts catalog items deterministically based on brief `eventType` and Style DNA traits (Heritage, Modern, Intimate, Grand).
- **Concrete Code Blueprint:**
  ```ts
  import type { CuratedIdea, EventBrief, StyleDNA } from '@/lib/engine/types'

  export const CURATED_IDEAS: CuratedIdea[] = [
    {
      id: 'idea_kulhad_chai',
      title: 'Kulhad Chai & Filter Coffee Bar',
      devanagariTitle: 'कुल्हड़ चाय बार',
      tagline: 'Artisanal clay cups, ginger-cardamom brewing, and live rusk dipping',
      description: 'A cozy brass counter serving slow-simmered masala chai in terracotta kulhads and South Indian filter coffee.',
      category: 'catering',
      eventTypes: ['wedding', 'birthday', 'community'],
      costPaise: 15_000_00, // ₹15,000
      leadDays: 21,
      styleTags: ['heritage', 'intimate', 'comfort'],
      culturalNuance: 'Clay kulhads bring an earthy petrichor aroma that grounds late-night musical pheras or morning welcoming receptions.',
      timelineTask: {
        title: 'Lock Kulhad Chai Bar & Terracotta Potter Vendor',
        notes: 'Confirm 400 fresh kiln-fired unglazed kulhads and fresh cow milk delivery.',
      },
    },
    {
      id: 'idea_live_shehnai',
      title: 'Live Shehnai & Nagada Jugalbandi',
      devanagariTitle: 'शहनाई व नगाड़ा जुगलबंदी',
      tagline: 'Traditional welcoming melodies resonating at the gateway and mandap',
      description: 'A quartet of master Shehnai and Nagada ustads playing classical Raag Bilawal welcoming tunes as guests arrive.',
      category: 'entertainment',
      eventTypes: ['wedding', 'community'],
      costPaise: 25_000_00, // ₹25,000
      leadDays: 45,
      styleTags: ['heritage', 'grand', 'royal'],
      culturalNuance: 'Shehnai notes are deeply considered auspicious (Mangal Dhwani) across Indian Vedic and court traditions.',
      timelineTask: {
        title: 'Book Shehnai & Nagada Classical Ensemble',
        notes: 'Confirm acoustic seating carpet near the entryway with flower petals.',
      },
    },
    {
      id: 'idea_jalebi_rabdi',
      title: 'Live Jalebi & Chilled Rabdi Counter',
      devanagariTitle: 'गरम जलेबी व रबड़ी काउंटर',
      tagline: 'Saffron-infused crisp spirals fried live and dipped in slow-reduced malai',
      description: 'Halwai frying spiraled jalebis live in pure desi ghee, served atop cold cardamom rabdi in earthenware bowls.',
      category: 'catering',
      eventTypes: ['wedding', 'birthday', 'community'],
      costPaise: 20_000_00, // ₹20,000
      leadDays: 14,
      styleTags: ['feast', 'heritage', 'playful'],
      culturalNuance: 'The contrast of piping-hot saffron spirals with chilled rabdi is an undisputed favorite across festive North & West India.',
      timelineTask: {
        title: 'Order Halwai Desi Ghee Jalebi Setup',
        notes: 'Ensure separate frying counter with copper kadhai and outdoor ventilation.',
      },
    },
    {
      id: 'idea_caricature_pavilion',
      title: 'Live Caricature & Guest Keepsake Pavilion',
      devanagariTitle: 'हास्य चित्र दीर्घा',
      tagline: 'Whimsical 3-minute portraits drawn live for guests to take home',
      description: 'Two skilled caricature artists drawing vibrant stylized portraits of guests in their festive attire on branded cards.',
      category: 'entertainment',
      eventTypes: ['wedding', 'birthday', 'community'],
      costPaise: 18_000_00, // ₹18,000
      leadDays: 30,
      styleTags: ['modern', 'playful', 'intimate'],
      culturalNuance: 'Gives guests a personal, joyful keepsake from the evening that outlasts disposable favors.',
      timelineTask: {
        title: 'Commission Caricature Artists & Custom Paper Stock',
        notes: 'Print event title watermark on 300 GSM textured card sheets.',
      },
    },
    {
      id: 'idea_jali_marigold',
      title: 'Terracotta Jali & Marigold Photo Pavilion',
      devanagariTitle: 'जाली व गेंदा मंडप',
      tagline: 'Geometric architectural terracotta screens draped in fresh orange genda',
      description: 'An architectural photo backdrop featuring geometric brass/terracotta jali lattices draped with fresh fragrant marigold garlands.',
      category: 'decor',
      eventTypes: ['wedding', 'community'],
      costPaise: 35_000_00, // ₹35,000
      leadDays: 30,
      styleTags: ['heritage', 'artisan', 'grand'],
      culturalNuance: 'Terracotta and marigold capture the essence of Indian temple and haveli courtyards with zero plastic waste.',
      timelineTask: {
        title: 'Approve Terracotta Jali Backdrop Rigging',
        notes: 'Source 50kg fresh local marigolds on morning of event.',
      },
    },
    {
      id: 'idea_ittar_welcome',
      title: 'Gulab-Jal & Ittar Welcoming Station',
      devanagariTitle: 'इत्र व गुलाब-जल स्वागत',
      tagline: 'Artisanal crystal ittar dabbers and fragrant chilled rosewater misting',
      description: 'Hosts greeting guests with crystal perfume dabbers of Kannauj Mitti or Khus ittar, accompanied by cool rosewater sprinklers.',
      category: 'favors',
      eventTypes: ['wedding', 'community'],
      costPaise: 12_000_00, // ₹12,000
      leadDays: 14,
      styleTags: ['heritage', 'intimate', 'sensory'],
      culturalNuance: 'Mitti ittar (the scent of rain on baked earth) creates an unforgettable sensory imprint upon arrival.',
      timelineTask: {
        title: 'Source Kannauj Ittar Phials & Brass Sprinklers',
        notes: 'Select Khus, Gulab, and Mitti fragrances from Kannauj distillers.',
      },
    },
    {
      id: 'idea_brass_diya',
      title: 'Handcrafted Brass Diya & Seed Favors',
      devanagariTitle: 'पीतल दीया व बीज उपहार',
      tagline: 'Cast brass oil lamps paired with plantable marigold seed paper cards',
      description: 'Guests receive a miniature solid brass diya wrapped in hand-spun cotton potlis with plantable seed blessing cards.',
      category: 'favors',
      eventTypes: ['wedding', 'birthday', 'community'],
      costPaise: 16_000_00, // ₹16,000
      leadDays: 21,
      styleTags: ['sustainable', 'heritage', 'intimate'],
      culturalNuance: 'A perpetual symbol of light (jyoti) that guests light in their own homes for Diwali or daily prayers.',
      timelineTask: {
        title: 'Order Brass Diyas & Potli Pouches',
        notes: 'Pack 150 potlis with custom calligraphy blessing tags.',
      },
    },
    {
      id: 'idea_kulfi_cart',
      title: 'Vintage Matka Kulfi & Falooda Bicycle Cart',
      devanagariTitle: 'मटका कुल्फी व फालूदा ठेला',
      tagline: 'Artisanal malai, pista, and paan kulfi sticks served from a retro wooden cart',
      description: 'A charming hand-painted wooden bicycle cart serving authentic frozen earthenware matka kulfi topped with rose falooda and sabja seeds.',
      category: 'catering',
      eventTypes: ['wedding', 'birthday', 'community'],
      costPaise: 14_000_00, // ₹14,000
      leadDays: 10,
      styleTags: ['nostalgic', 'playful', 'feast'],
      culturalNuance: 'A nostalgic street-food favorite that brings multi-generational delight across grandmothers and children alike.',
      timelineTask: {
        title: 'Book Vintage Kulfi Cart & Ice Retention Setup',
        notes: 'Confirm 4 flavors: Kesar Pista, Paan, Malai Rabdi, and Mango.',
      },
    },
    {
      id: 'idea_sufi_baithak',
      title: 'Acoustic Sufi & Ghazal Baithak',
      devanagariTitle: 'सूफ़ी व ग़ज़ल बैठक',
      tagline: 'Floor gaddi seating with candlelit harmonium, tabla, and soulful poetry',
      description: 'An intimate candlelit lounge area with bolsters, floor carpets, and acoustic Ghazal maestros performing Amir Khusrau classics.',
      category: 'entertainment',
      eventTypes: ['wedding', 'community'],
      costPaise: 40_000_00, // ₹40,000
      leadDays: 60,
      styleTags: ['heritage', 'intimate', 'acoustic'],
      culturalNuance: 'Baithak seating dissolves guest hierarchies, inviting spontaneous sing-alongs and heartfelt conversation.',
      timelineTask: {
        title: 'Contract Sufi Baithak Musicians & Floor Setup',
        notes: 'Confirm acoustic microphones and low gaddi bolsters.',
      },
    },
    {
      id: 'idea_drone_petals',
      title: 'Floral Petal Shower Entry Rig',
      devanagariTitle: 'गुलाब पंखुड़ी वर्षा',
      tagline: 'Calibrated shower of fresh rose petals descending upon grand procession',
      description: 'An overhead ceiling or mechanical boom releasing a slow cascade of fragrant pink and crimson rose petals during the couple entry or cake cutting.',
      category: 'decor',
      eventTypes: ['wedding', 'birthday'],
      costPaise: 30_000_00, // ₹30,000
      leadDays: 30,
      styleTags: ['grand', 'spectacle', 'romantic'],
      culturalNuance: 'Creates an iconic cinematic photograph while filling the air with authentic rose fragrance.',
      timelineTask: {
        title: 'Arrange Floral Petal Rigging & Desi Gulab Supply',
        notes: 'Source 30kg fresh desi rose petals without thorns or stems.',
      },
    },
    {
      id: 'idea_dhol_tasha',
      title: 'High-Energy Dhol Tasha Procession',
      devanagariTitle: 'ढोल ताशा वादन',
      tagline: 'Thunderous rhythmic percussion welcoming the procession',
      description: 'An 8-member troupe playing traditional Puneri or Punjabi dhol tasha beats to ignite celebration energy.',
      category: 'entertainment',
      eventTypes: ['wedding', 'birthday', 'community'],
      costPaise: 22_000_00, // ₹22,000
      leadDays: 21,
      styleTags: ['high-energy', 'grand', 'traditional'],
      culturalNuance: 'Inimitable celebratory energy that gets every guest moving immediately upon arrival.',
      timelineTask: {
        title: 'Book Dhol Tasha Troupe & Procession Timing',
        notes: 'Coordinate arrival slot with venue security.',
      },
    },
    {
      id: 'idea_vintage_polaroid',
      title: 'Vintage Polaroid Guestbook Station',
      devanagariTitle: 'विंटेज पोलरॉइड स्मृति पट्ट',
      tagline: 'Instant cameras with metallic gel pens and handmade cotton paper album',
      description: 'A wooden desk with retro instant cameras, extra film packs, and a bound organic cotton paper guestbook where guests paste snapshots with handwritten blessings.',
      category: 'photo_film',
      eventTypes: ['wedding', 'birthday'],
      costPaise: 15_000_00, // ₹15,000
      leadDays: 14,
      styleTags: ['modern', 'intimate', 'nostalgic'],
      culturalNuance: 'A tangible heirloom created directly by loved ones during the event, preserved for decades.',
      timelineTask: {
        title: 'Order Instant Film Packs & Handmade Paper Album',
        notes: 'Prepare 100 film sheets and test camera batteries.',
      },
    },
  ]

  /**
   * Deterministic matching and affinity ranking based on brief and Style DNA dimensions.
   */
  export function getPersonalizedIdeas(
    brief: EventBrief,
    styleDNA?: StyleDNA
  ): CuratedIdea[] {
    // 1. Filter by event type
    const matchingIdeas = CURATED_IDEAS.filter((idea) =>
      idea.eventTypes.includes(brief.eventType)
    )

    if (!styleDNA) {
      return matchingIdeas
    }

    // 2. Score affinity based on Style DNA dimensions
    const dims = styleDNA.dimensions
    return [...matchingIdeas].sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Heritage affinity
      if (dims.heritageVsModern.score < 50) {
        if (a.styleTags.includes('heritage')) scoreA += 2
        if (b.styleTags.includes('heritage')) scoreB += 2
      } else {
        if (a.styleTags.includes('modern')) scoreA += 2
        if (b.styleTags.includes('modern')) scoreB += 2
      }

      // Grand vs Intimate affinity
      if (dims.grandVsIntimate.score < 50) {
        if (a.styleTags.includes('intimate')) scoreA += 2
        if (b.styleTags.includes('intimate')) scoreB += 2
      } else {
        if (a.styleTags.includes('grand')) scoreA += 2
        if (b.styleTags.includes('grand')) scoreB += 2
      }

      // Sensory / Feast affinity
      if (dims.sensoryScale.score > 60) {
        if (a.category === 'catering' || a.styleTags.includes('sensory')) scoreA += 1
        if (b.category === 'catering' || b.styleTags.includes('sensory')) scoreB += 1
      }

      return scoreB - scoreA
    })
  }
  ```

---

## 4. Pattern Specifications: Workspace UI Components

### 4.1 Curated Idea Card: `src/components/workspace/CuratedIdeaCard.tsx`

- **Role:** Interactive celebration enhancement card.
- **Closest Analog:** [`src/components/workspace/BudgetLineCard.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/BudgetLineCard.tsx) and [`src/components/workspace/StyleDNACard.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/StyleDNACard.tsx).
- **Key Invariants:**
  1. Displays title, Devanagari flourish, tagline, formatted INR cost pill (`formatINR`), lead-time badge, category icon, and cultural nuance text.
  2. Direct toggle switch with optimistic UI.
  3. Dynamic preview of affected donor lines before toggling: shows which flexible lines will donate funds and whether adoption would trigger an Infeasible State.
  4. Micro-haptic trigger on toggle (`navigator.vibrate(50)`).
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React from 'react'
  import type { CuratedIdea, Plan, DisplacedDonor } from '@/lib/engine/types'
  import { formatINR } from '@/lib/engine/currency'
  import { Card, CardContent } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { Switch } from '@/components/ui/switch'
  import { Sparkles, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
  import { cn } from '@/lib/utils'

  interface CuratedIdeaCardProps {
    idea: CuratedIdea
    plan: Plan
    isAdopted: boolean
    isReadOnly?: boolean
    onToggle: (idea: CuratedIdea, adopted: boolean) => void
  }

  export function CuratedIdeaCard({
    idea,
    plan,
    isAdopted,
    isReadOnly,
    onToggle,
  }: CuratedIdeaCardProps) {
    // Calculate potential donor impact if toggled on
    const wouldExhaustCapacity = React.useMemo(() => {
      if (isAdopted) return false
      const flexibleDonors = plan.lines
        .filter((l) => l.lineType === 'flexible' && !l.isProtected && l.category !== idea.category)
      const totalAvailable = flexibleDonors.reduce((sum, l) => {
        const floor = Math.round((l.baselinePaise * 0.40) / 100) * 100
        return sum + Math.max(0, l.currentPaise - floor)
      }, 0)
      return totalAvailable < idea.costPaise
    }, [isAdopted, plan.lines, idea.costPaise, idea.category])

    const handleSwitchChange = (checked: boolean) => {
      if (isReadOnly) return
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50) // Micro-haptic pulse
      }
      onToggle(idea, checked)
    }

    return (
      <Card
        className={cn(
          'relative transition-all duration-200 border',
          isAdopted
            ? 'border-marigold bg-marigold/10 shadow-sm ring-1 ring-marigold/40'
            : 'border-royal-plum/10 bg-warm-ivory hover:border-royal-plum/25 hover:shadow-xs'
        )}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
          {/* Header: Title, Devanagari Flourish & Toggle */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-royal-plum">{idea.title}</h4>
                {idea.devanagariTitle && (
                  <span className="font-serif text-2xs text-royal-plum/50">
                    {idea.devanagariTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-royal-plum/70 line-clamp-2">{idea.tagline}</p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Switch
                checked={isAdopted}
                onCheckedChange={handleSwitchChange}
                disabled={isReadOnly}
                aria-label={`Adopt idea ${idea.title}`}
              />
            </div>
          </div>

          {/* Badges: Category, Cost & Lead Time */}
          <div className="flex flex-wrap items-center gap-2 text-2xs">
            <Badge variant="outline" className="border-royal-plum/15 text-royal-plum/70 capitalize">
              {idea.category}
            </Badge>

            <span className="font-serif font-bold text-xs text-royal-plum tabular-nums">
              {formatINR(idea.costPaise)}
            </span>

            <span className="flex items-center gap-1 text-royal-plum/60 text-3xs">
              <Clock className="w-2.5 h-2.5" />
              <span>{idea.leadDays}d lead</span>
            </span>

            {isAdopted && (
              <Badge variant="default" className="bg-marigold text-royal-plum text-3xs font-semibold gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Adopted</span>
              </Badge>
            )}
          </div>

          {/* Cultural Nuance Note */}
          <div className="rounded-lg bg-white/60 p-2 text-2xs text-royal-plum/80 italic border border-royal-plum/5">
            &ldquo;{idea.culturalNuance}&rdquo;
          </div>

          {/* Pre-adoption donor warning (Permissive Infeasible notice, D-04) */}
          {!isAdopted && wouldExhaustCapacity && (
            <div className="flex items-center gap-1.5 text-3xs text-amber-900 bg-amber-100/70 rounded-md px-2 py-1 border border-amber-300/60">
              <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
              <span>Adopting will exceed flexible capacity & activate Shortfall Banner remedies</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  ```

---

### 4.2 Protected Moment Shimmer & Donor Badges: `src/components/workspace/BudgetLineCard.tsx`

- **Role:** Line card displaying Protected Moment immunity and donor deduction badges.
- **Closest Analog:** Existing [`src/components/workspace/BudgetLineCard.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/BudgetLineCard.tsx).
- **Key Enhancements (MOMENT-02, MOMENT-03, BUDGET-04, D-05, D-08):**
  1. **Inline Donor Tags:** Displays deduction pills for displaced funds (e.g., `-₹15,000 for Chai Bar`) linking to the idea.
  2. **Gulabi Rose Shimmer Animation:** Subtle CSS shimmer ring on Protected Moment card.
  3. **Inviolable Immunity Badge:** Tooltip: *"Protected Moment is mathematically immune to displacement (ADR-0004)"*.
  4. **Micro-Haptic:** Vibrates `navigator.vibrate(50)` on lock toggle.
- **Concrete Code Blueprint:**
  ```tsx
  // Enhancements inside BudgetLineCard.tsx

  // 1. Shimmer class applied to Protected Moment Card:
  <Card
    id={`category-${line.category}`}
    className={cn(
      'relative transition-all duration-200',
      line.isProtected
        ? 'border-gulabi-rose bg-gulabi-rose/15 shadow-sm ring-1 ring-gulabi-rose/50 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_3s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent'
        : 'border-royal-plum/10 bg-warm-ivory hover:border-royal-plum/25 hover:shadow-xs'
    )}
  >

  // 2. Inline Donor Deduction Badges (D-05):
  {displacedRecords && displacedRecords.length > 0 && (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {displacedRecords.map((r, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className="bg-amber-100/80 text-amber-950 border-amber-300 text-3xs font-medium gap-1"
          title={`Displaced to fund ${r.ideaTitle}`}
        >
          <span>-{formatINR(r.displacedPaise)}</span>
          <span className="text-royal-plum/50">for {r.ideaTitle}</span>
        </Badge>
      ))}
    </div>
  )}

  // 3. Protected Moment Inviolable Tooltip & Micro-Haptic:
  const handleLockClick = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    onSetProtected(line.category)
  }
  ```

---

### 4.3 Seasonal Advisory Banner: `src/components/workspace/SeasonalAdvisoryBanner.tsx`

- **Role:** Ambient seasonal intelligence banner atop the Timeline tab.
- **Closest Analog:** [`src/components/workspace/ConcurrencyConflictBanner.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/ConcurrencyConflictBanner.tsx) and [`src/components/workspace/V2ChangeBanner.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/V2ChangeBanner.tsx).
- **Key Invariants:**
  1. Displays calm Marigold/Plum banner for detected Saya dates, monsoon hazards, or summer heat.
  2. Lists dynamic lead-time buffer status (`+30d peak buffer active`).
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React from 'react'
  import type { EnvironmentalAnalysis } from '@/lib/engine/types'
  import { Sparkles, CloudRain, Sun, CalendarAlert, Info } from 'lucide-react'
  import { Card, CardContent } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'

  interface SeasonalAdvisoryBannerProps {
    analysis?: EnvironmentalAnalysis
  }

  export function SeasonalAdvisoryBanner({ analysis }: SeasonalAdvisoryBannerProps) {
    if (!analysis || analysis.detectedRisks.length === 0) return null

    return (
      <Card className="border-marigold/40 bg-marigold/10 shadow-2xs">
        <CardContent className="p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-marigold" />
              <h4 className="font-serif font-bold text-sm text-royal-plum">
                {analysis.seasonalSummaryTitle}
              </h4>
            </div>

            <Badge variant="outline" className="border-royal-plum/20 bg-warm-ivory text-2xs text-royal-plum">
              Indian Calendar Intelligence
            </Badge>
          </div>

          <p className="text-xs text-royal-plum/70">{analysis.seasonalSummaryText}</p>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-royal-plum/10">
            {analysis.detectedRisks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-center gap-1.5 rounded-lg bg-warm-ivory px-2.5 py-1 text-2xs border border-royal-plum/10 text-royal-plum/80"
              >
                {risk.id.includes('saya') && <CalendarAlert className="w-3 h-3 text-marigold" />}
                {risk.id.includes('monsoon') && <CloudRain className="w-3 h-3 text-sky-600" />}
                {risk.id.includes('heat') && <Sun className="w-3 h-3 text-amber-600" />}
                {risk.id.includes('holiday') && <Info className="w-3 h-3 text-purple-600" />}

                <span className="font-semibold text-royal-plum">{risk.title}</span>
                {risk.leadTimeBufferDays && (
                  <span className="font-mono text-3xs font-bold text-marigold-deep bg-marigold/20 px-1 rounded">
                    +{risk.leadTimeBufferDays}d buffer
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  ```

---

### 4.4 Tier 1 Floating Instant Undo Action Bar: `src/components/workspace/UndoActionBar.tsx`

- **Role:** Floating bottom action bar surfacing an immediate 1-click undo pill for 8 seconds after idea toggling or shortfall remedy application.
- **Closest Analog:** [`src/components/workspace/V2ChangeBanner.tsx`](file:///home/zeph/Code/mehfil/src/components/workspace/V2ChangeBanner.tsx).
- **Key Invariants:**
  1. Auto-dismisses after 8 seconds with animated countdown bar.
  2. Clicking "Undo" immediately invokes callback and dismisses.
- **Concrete Code Blueprint:**
  ```tsx
  'use client'

  import React, { useEffect, useState } from 'react'
  import { motion, AnimatePresence } from 'motion/react'
  import { RotateCcw, X } from 'lucide-react'
  import { Button } from '@/components/ui/button'

  interface UndoActionBarProps {
    message: string | null
    onUndo: () => void
    onDismiss: () => void
    durationMs?: number
  }

  export function UndoActionBar({
    message,
    onUndo,
    onDismiss,
    durationMs = 8000,
  }: UndoActionBarProps) {
    const [progress, setProgress] = useState(100)

    useEffect(() => {
      if (!message) return

      setProgress(100)
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100)
        setProgress(remaining)

        if (remaining <= 0) {
          clearInterval(interval)
          onDismiss()
        }
      }, 50)

      return () => clearInterval(interval)
    }, [message, durationMs, onDismiss])

    if (!message) return null

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-full border border-royal-plum/20 bg-royal-plum text-warm-ivory px-4 py-2.5 shadow-xl flex items-center justify-between gap-3">
            <span className="text-xs font-medium truncate">{message}</span>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onUndo}
                className="h-7 px-2.5 text-2xs font-bold bg-marigold text-royal-plum hover:bg-marigold/90 border-transparent gap-1 rounded-full"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </Button>

              <button
                type="button"
                onClick={onDismiss}
                className="text-warm-ivory/60 hover:text-warm-ivory p-0.5 rounded-full"
                aria-label="Dismiss undo bar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto-dismiss progress countdown line */}
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-marigold transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }
  ```

---

## 5. Pattern Specifications: Testing Suites

### 5.1 Engine Unit Tests: `tests/engine/budget.test.ts`

- **Role:** Rigorous unit tests verifying mathematical invariants.
- **Closest Analog:** Existing [`tests/engine/budget.test.ts:52-113`](file:///home/zeph/Code/mehfil/tests/engine/budget.test.ts#L52-L113).
- **Test Matrix:**
  1. `adoptIdea` drains flexible lines in strict elasticity order ($Misc \rightarrow Ent \rightarrow Decor$).
  2. `adoptIdea` strictly preserves 40% floor on all flexible lines.
  3. `adoptIdea` never touches Protected Moment allocation.
  4. `adoptIdea` enters permissive Infeasible State when capacity is exhausted.
  5. `retractIdea` performs exact inverse reversion restoring exact paise to donors.
  6. `applyTrimElasticRemedy` trims flexible lines sequentially only until deficit is satisfied.

### 5.2 Environmental Engine Tests: `tests/engine/environmental.test.ts`

- **Role:** Tests verifying pure UTC calendar math and risk window detection.
- **Closest Analog:** [`tests/engine/timeline.test.ts`](file:///home/zeph/Code/mehfil/tests/engine/timeline.test.ts).
- **Test Matrix:**
  1. Dates between Nov 1 and Feb 28 in any Indian city trigger `peak_saya_winter` with +30d buffer.
  2. Dates between Apr 15 and May 31 trigger `peak_saya_summer` with +15d buffer.
  3. Monsoon months (Jun–Aug) trigger `monsoon_outdoor` hazard.
  4. Extreme heat in North India (Delhi, Jaipur in May/Jun) triggers `extreme_summer_heat`.
  5. Dry days (Jan 26, Aug 15, Oct 2) trigger `holiday_clash`.

---

## 6. Summary of Key Invariants

1. **Integer Arithmetic Only:** All calculations remain in whole paise (`Paise`). Floating-point money arithmetic is strictly forbidden (ADR-0001).
2. **Protected Moment Inviolability:** Protected lines have absolute immunity against downward trimming and idea displacement (ADR-0004, MOMENT-02).
3. **Strict Elasticity Order:** Flexible lines donate in rank order: Rank 1 (Misc) $\rightarrow$ Rank 2 (Entertainment) $\rightarrow$ Rank 3 (Decor). No higher-rank line is touched until lower ranks reach their 40% floor (BUDGET-04).
4. **Permissive Non-Blocking Shortfall:** Exhausting flexible capacity never blocks organizer action. The engine transitions to an Infeasible State and offers 3 deterministic remedies (ADR-0002).
5. **Exact Inverse Reversion:** Toggling off an adopted idea restores exact paise to exact donor lines in reverse order (IDEA-03).
6. **Pure UTC Calendar Logic:** All date arithmetic is UTC-based to eliminate timezone day-shifting errors.
7. **Two-Tier Undo:** Tier 1 provides an immediate 8-second floating undo pill; Tier 2 provides immutable forward version restore via ChangeExplainer.
8. **Calm Affirming Tone:** All advisories maintain a celebratory, calm voice; red alert panic banners are forbidden (ADR-0005, DESIGN.md).
