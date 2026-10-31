'use client'

import React, { useMemo } from 'react'
import type {
  BudgetCategory,
  CuratedIdea,
  Plan,
  PlanChangeRecord,
  PlanVersionRecord,
} from '@/lib/engine/types'
import type { StyleDimensions } from '@/lib/ai/schemas'
import { applyCommittedBookings, calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { BudgetSection } from './BudgetSection'
import { ChangeExplainer } from './ChangeExplainer'
import { CuratedIdeasSection } from './CuratedIdeasSection'
import { StyleDNACard } from './StyleDNACard'
import { TimelineSection } from './TimelineSection'
import type { PlanTabId } from './tabs'
import { resolveChangeList, resolveCurrentVersion } from './workspace-history'

/** Every edit the panes can report upward. */
export interface WorkspacePaneActions {
  onGuestCountChange: (count: number) => void
  onSetProtected: (category: BudgetCategory) => void
  onCheckQuote: (category: BudgetCategory) => void
  onOpenInspector: () => void
  onUnlockQuote?: (category: BudgetCategory) => void
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
  onRetuneStyle?: (dimensions: StyleDimensions) => void
  onResetToBaseline?: () => void
  onRetryExtraction?: () => void
  onRestoreVersion?: (targetVersion: number) => void
  onUndo?: (item?: PlanChangeRecord, index?: number) => void
}

export interface WorkspacePanesProps {
  plan: Plan
  activeTab: PlanTabId
  isReadOnly: boolean
  isExtracting: boolean
  /** Banner shown above the budget and style panes when the style changes. */
  v2Banner?: React.ReactNode
  /** Banner shown above the budget and ideas panes when the plan is short. */
  shortfall: React.ReactNode
  changes?: PlanChangeRecord[]
  /** Older name for `changes`; used when `changes` is not given. */
  history?: PlanChangeRecord[]
  versions?: PlanVersionRecord[]
  currentVersionNumber?: number
  currentVersion?: PlanVersionRecord
  actions: WorkspacePaneActions
}

/** Shows the pane for the active tab. Only one pane is mounted at a time. */
export function WorkspacePanes({
  plan,
  activeTab,
  isReadOnly,
  isExtracting,
  v2Banner,
  shortfall,
  changes,
  history,
  versions,
  currentVersionNumber,
  currentVersion,
  actions,
}: WorkspacePanesProps) {
  // Booked tasks come from the plan's committed lines, so they match what is saved.
  const schedule = useMemo(
    () =>
      applyCommittedBookings(
        calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount),
        plan
      ),
    [plan]
  )
  const changeList = resolveChangeList(changes, history)
  const effectiveCurrentVersion = resolveCurrentVersion(
    versions,
    currentVersion,
    currentVersionNumber
  )

  return (
    <div key={activeTab} className="flex flex-col gap-6 motion-safe:animate-rise">
      {activeTab === 'budget' && (
        <div data-testid="pane-budget" className="flex flex-col gap-6">
          {v2Banner}
          {shortfall}
          <BudgetSection
            plan={plan}
            onGuestCountChange={actions.onGuestCountChange}
            onSetProtected={actions.onSetProtected}
            onCheckQuote={actions.onCheckQuote}
            onUnlockQuote={actions.onUnlockQuote}
            onOpenInspector={actions.onOpenInspector}
            isReadOnly={isReadOnly}
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div data-testid="pane-timeline">
          <TimelineSection plan={plan} schedule={schedule} />
        </div>
      )}

      {activeTab === 'ideas' && (
        <div data-testid="pane-ideas" className="flex flex-col gap-6">
          {shortfall}
          <CuratedIdeasSection
            plan={plan}
            isReadOnly={isReadOnly}
            onAdoptIdea={actions.onAdoptIdea ?? (() => {})}
            onRetractIdea={actions.onRetractIdea ?? (() => {})}
          />
        </div>
      )}

      {activeTab === 'style' && (
        <div data-testid="pane-style" className="flex flex-col gap-6">
          {v2Banner}
          <StyleDNACard
            plan={plan}
            currentVersion={effectiveCurrentVersion}
            isReadOnly={isReadOnly}
            isExtracting={isExtracting}
            onRetuneStyle={actions.onRetuneStyle}
            onResetToBaseline={actions.onResetToBaseline}
            onRetryExtraction={actions.onRetryExtraction}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div data-testid="pane-history">
          <ChangeExplainer
            plan={plan}
            changes={changeList}
            versions={versions}
            currentVersionNumber={currentVersionNumber}
            onRestoreVersion={actions.onRestoreVersion}
            isReadOnly={isReadOnly}
            onUndo={actions.onUndo}
          />
        </div>
      )}
    </div>
  )
}
