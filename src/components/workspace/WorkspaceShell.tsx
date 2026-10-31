'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type {
  BudgetCategory,
  CuratedIdea,
  Plan,
  PlanChangeRecord,
  PlanVersionRecord,
  ShortfallRemedy,
  VendorQuote,
} from '@/lib/engine/types'
import type { StyleDimensions } from '@/lib/ai/schemas'
import { applyCommittedBookings, calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'
import { SmartInspectorSheet } from '@/components/quotes/SmartInspectorSheet'
import { BudgetSection } from './BudgetSection'
import { ChangeExplainer } from './ChangeExplainer'
import { CuratedIdeasSection } from './CuratedIdeasSection'
import { ShareSaveModal } from './ShareSaveModal'
import { ShortfallBanner } from './ShortfallBanner'
import { StyleDNACard } from './StyleDNACard'
import type { SyncState } from './SyncStatusBadge'
import { TimelineSection } from './TimelineSection'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceTabs } from './WorkspaceTabs'
import type { PlanTabId } from './tabs'
import { useQuotePanels } from './hooks/useQuotePanels'

export interface WorkspaceShellProps {
  plan: Plan
  changes?: PlanChangeRecord[]
  history?: PlanChangeRecord[]
  versions?: PlanVersionRecord[]
  currentVersionNumber?: number
  currentVersion?: PlanVersionRecord
  previousGuestCount?: number
  syncStatus?: SyncState
  isReadOnly?: boolean
  editKey?: string
  initialShareToken?: string
  isExtracting?: boolean
  v2Banner?: React.ReactNode
  /** Extra notices shown above the tab content (e.g. a sync conflict). */
  notices?: React.ReactNode
  /** Active tab. When given together with `basePath`, tabs are real links. */
  activeTab?: PlanTabId
  basePath?: string
  onGuestCountChange: (count: number) => void
  onSetProtected: (category: BudgetCategory) => void
  onApplyRemedy: (remedy: ShortfallRemedy) => void
  onUndo?: (item?: PlanChangeRecord, index?: number) => void
  onRestoreVersion?: (targetVersion: number) => void
  onUnlockEdit?: () => void
  onRetuneStyle?: (dimensions: StyleDimensions) => void
  onResetToBaseline?: () => void
  onRetryExtraction?: () => void
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
  onCommitQuote?: (quote: VendorQuote, tierId: string, activeAdderIds: string[]) => void
  onUnlockQuote?: (category: BudgetCategory) => void
  onCheckQuote?: (category: BudgetCategory) => void
  onOpenSmartInspector?: (category?: BudgetCategory) => void
}

/**
 * Lays out the workspace: header, tabs, the active pane and the side panels. It is a
 * controlled component. It shows the `plan` it is given and reports every edit upward, so the
 * plan on screen is always the plan that gets saved.
 */
export function WorkspaceShell({
  plan,
  changes,
  history,
  versions,
  currentVersionNumber,
  currentVersion,
  previousGuestCount,
  syncStatus,
  isReadOnly = false,
  editKey,
  initialShareToken,
  isExtracting = false,
  v2Banner,
  notices,
  activeTab: activeTabProp,
  basePath,
  onGuestCountChange,
  onSetProtected,
  onApplyRemedy,
  onUndo,
  onRestoreVersion,
  onUnlockEdit,
  onRetuneStyle,
  onResetToBaseline,
  onRetryExtraction,
  onAdoptIdea,
  onRetractIdea,
  onCommitQuote,
  onUnlockQuote,
  onCheckQuote,
  onOpenSmartInspector,
}: WorkspaceShellProps) {
  const [localTab, setLocalTab] = useState<PlanTabId>('budget')
  const activeTab = activeTabProp ?? localTab
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const tabsRef = useRef<HTMLElement>(null)

  const quotes = useQuotePanels({
    plan,
    onCheckQuote,
    onOpenSmartInspector,
    onCommitQuote,
    onUnlockQuote,
  })

  // Booked tasks come from the plan's committed lines, so they match what is saved.
  const schedule = useMemo(
    () =>
      applyCommittedBookings(
        calculateBackwardsTimeline(plan.brief.eventDate, plan.brief.guestCount),
        plan
      ),
    [plan]
  )

  // When the tab changes while the tab bar is stuck, bring the new content to the top.
  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (window.scrollY > top) window.scrollTo({ top })
  }, [activeTab])

  const changeList = changes ?? history ?? []
  const effectiveCurrentVersion =
    currentVersion ||
    versions?.find((v) => v.versionNumber === currentVersionNumber) ||
    versions?.[0]

  const shortfall = (
    <ShortfallBanner
      plan={plan}
      isReadOnly={isReadOnly}
      previousGuestCount={previousGuestCount}
      onApplyRemedy={onApplyRemedy}
      onUndo={() => onUndo?.()}
    />
  )

  return (
    <div className="min-h-dvh">
      <WorkspaceHeader
        plan={plan}
        syncStatus={syncStatus}
        isReadOnly={isReadOnly}
        onUnlockEdit={onUnlockEdit}
        onShare={() => setIsShareModalOpen(true)}
      />

      <WorkspaceTabs
        ref={tabsRef}
        activeTab={activeTab}
        basePath={basePath}
        adoptedCount={plan.adoptedIdeas?.length ?? 0}
        onSelect={setLocalTab}
      />

      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-col gap-6">
          {notices}

          <div key={activeTab} className="flex flex-col gap-6 motion-safe:animate-rise">
            {activeTab === 'budget' && (
              <div data-testid="pane-budget" className="flex flex-col gap-6">
                {v2Banner}
                {shortfall}
                <BudgetSection
                  plan={plan}
                  onGuestCountChange={onGuestCountChange}
                  onSetProtected={onSetProtected}
                  onCheckQuote={quotes.checkQuote}
                  onUnlockQuote={onUnlockQuote}
                  onOpenInspector={() => quotes.openInspector()}
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
                  onAdoptIdea={onAdoptIdea ?? (() => {})}
                  onRetractIdea={onRetractIdea ?? (() => {})}
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
                  onRetuneStyle={onRetuneStyle}
                  onResetToBaseline={onResetToBaseline}
                  onRetryExtraction={onRetryExtraction}
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
                  onRestoreVersion={onRestoreVersion}
                  isReadOnly={isReadOnly}
                  onUndo={onUndo}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <ShareSaveModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        planId={plan.id}
        planTitle={plan.brief.title}
        editKey={editKey}
        initialShareToken={initialShareToken}
      />

      {/* Quarantined quote intake sandbox (QUOTE-01, QUOTE-02, D-01) */}
      <QuoteIntakeSheet
        open={quotes.intake.open}
        onOpenChange={quotes.intake.setOpen}
        category={quotes.intake.category}
        guestCount={plan.brief.guestCount}
        plan={plan}
        onCommitQuote={quotes.commitFromIntake}
      />

      {/* Contextual smart inspector slide-over (GENUI-01, GENUI-02, GENUI-03, D-14) */}
      <SmartInspectorSheet
        open={quotes.inspector.open}
        onOpenChange={quotes.inspector.setOpen}
        layout={quotes.inspector.layout}
        activeTier={quotes.inspector.tier}
        plan={plan}
        onCheckQuote={quotes.checkQuote}
        onCommitQuote={quotes.commitFromInspector}
        onUnlockQuote={quotes.unlockFromInspector}
        onAdoptIdea={onAdoptIdea}
        onRetractIdea={onRetractIdea}
      />
    </div>
  )
}
