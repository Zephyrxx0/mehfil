'use client'

import React, { useState } from 'react'
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
import { ShareSaveModal } from './ShareSaveModal'
import { ShortfallBanner } from './ShortfallBanner'
import type { SyncState } from './SyncStatusBadge'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspacePanes } from './WorkspacePanes'
import { WorkspaceQuoteSheets } from './WorkspaceQuoteSheets'
import { WorkspaceTabs } from './WorkspaceTabs'
import type { PlanTabId } from './tabs'
import { useQuotePanels } from './hooks/useQuotePanels'
import { useWorkspaceTab } from './hooks/useWorkspaceTab'

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
export function WorkspaceShell(props: WorkspaceShellProps) {
  const { plan, isReadOnly = false } = props
  const { activeTab, selectTab, tabsRef } = useWorkspaceTab(props.activeTab)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const quotes = useQuotePanels({
    plan,
    onCheckQuote: props.onCheckQuote,
    onOpenSmartInspector: props.onOpenSmartInspector,
    onCommitQuote: props.onCommitQuote,
    onUnlockQuote: props.onUnlockQuote,
  })

  const shortfall = (
    <ShortfallBanner
      plan={plan}
      isReadOnly={isReadOnly}
      previousGuestCount={props.previousGuestCount}
      onApplyRemedy={props.onApplyRemedy}
      onUndo={() => props.onUndo?.()}
    />
  )

  return (
    <div className="min-h-dvh">
      <WorkspaceHeader
        plan={plan}
        syncStatus={props.syncStatus}
        isReadOnly={isReadOnly}
        onUnlockEdit={props.onUnlockEdit}
        onShare={() => setIsShareModalOpen(true)}
      />

      <WorkspaceTabs
        ref={tabsRef}
        activeTab={activeTab}
        basePath={props.basePath}
        adoptedCount={plan.adoptedIdeas?.length ?? 0}
        onSelect={selectTab}
      />

      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-col gap-6">
          {props.notices}

          <WorkspacePanes
            plan={plan}
            activeTab={activeTab}
            isReadOnly={isReadOnly}
            isExtracting={props.isExtracting ?? false}
            v2Banner={props.v2Banner}
            shortfall={shortfall}
            changes={props.changes}
            history={props.history}
            versions={props.versions}
            currentVersionNumber={props.currentVersionNumber}
            currentVersion={props.currentVersion}
            actions={{
              onGuestCountChange: props.onGuestCountChange,
              onSetProtected: props.onSetProtected,
              onCheckQuote: quotes.checkQuote,
              onOpenInspector: () => quotes.openInspector(),
              onUnlockQuote: props.onUnlockQuote,
              onAdoptIdea: props.onAdoptIdea,
              onRetractIdea: props.onRetractIdea,
              onRetuneStyle: props.onRetuneStyle,
              onResetToBaseline: props.onResetToBaseline,
              onRetryExtraction: props.onRetryExtraction,
              onRestoreVersion: props.onRestoreVersion,
              onUndo: props.onUndo,
            }}
          />
        </div>
      </main>

      <ShareSaveModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        planId={plan.id}
        planTitle={plan.brief.title}
        editKey={props.editKey}
        initialShareToken={props.initialShareToken}
      />

      <WorkspaceQuoteSheets
        plan={plan}
        quotes={quotes}
        onAdoptIdea={props.onAdoptIdea}
        onRetractIdea={props.onRetractIdea}
      />
    </div>
  )
}
