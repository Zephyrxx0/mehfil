'use client'

import React from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { ConcurrencyConflictBanner } from './ConcurrencyConflictBanner'
import { V2ChangeBanner } from './V2ChangeBanner'
import { UndoActionBar } from './UndoActionBar'
import { WorkspaceShell } from './WorkspaceShell'
import type { PlanTabId } from './tabs'
import { usePlanEditor } from './hooks/usePlanEditor'
import { usePlanVersions } from './hooks/usePlanVersions'
import { useStyleDna } from './hooks/useStyleDna'

export interface PlanWorkspaceProps {
  initialPlan: Plan
  /** Active workspace tab; with `basePath` the tabs are links. */
  activeTab?: PlanTabId
  basePath?: string
  isReadOnly?: boolean
  editKey?: string
  initialVersions?: PlanVersionRecord[]
  initialShareToken?: string
  onUnlockEdit?: () => void
}

/**
 * The editable plan workspace. It wires three hooks to the presentational shell:
 *  - `usePlanVersions`: version history and every save to storage
 *  - `usePlanEditor`: the plan on screen, its undo history, and each edit
 *  - `useStyleDna`: the style extraction, retune and reset flow
 */
export function PlanWorkspace({
  initialPlan,
  activeTab,
  basePath,
  isReadOnly = false,
  editKey,
  initialVersions,
  initialShareToken,
  onUnlockEdit,
}: PlanWorkspaceProps) {
  const versions = usePlanVersions({ initialPlan, initialVersions, editKey, isReadOnly })
  const editor = usePlanEditor({
    initialPlan,
    isReadOnly,
    scheduleCommit: versions.scheduleCommit,
    commitNow: versions.commit,
  })
  const style = useStyleDna({
    plan: editor.plan,
    isReadOnly,
    snapshotOf: versions.snapshotOf,
    getPlan: editor.getPlan,
    replacePlan: editor.replacePlan,
    applyChange: editor.applyChange,
    commitNow: versions.commit,
    discardPending: versions.discardPending,
  })

  /** Brings an older version forward as a new version; history is never rewritten (D-10). */
  const restoreVersion = (versionNumber: number) => {
    if (isReadOnly) return
    const snapshot = versions.snapshotOf(versionNumber)
    if (!snapshot) return
    versions.discardPending()
    editor.replacePlan({ ...snapshot })
    void versions.commit({ ...snapshot }, `Reverted to v${versionNumber}`)
  }

  const showLatestFromOtherDevice = () => {
    const latest = versions.acceptConflict()
    if (latest) editor.replacePlan(latest)
  }

  const keepMyDraft = () => {
    void versions.commit(editor.getPlan(), 'Force saved local draft snapshot', {
      ignoreConflicts: true,
    })
  }

  return (
    <>
      <WorkspaceShell
        plan={editor.plan}
        activeTab={activeTab}
        basePath={basePath}
        notices={
          versions.conflict ? (
            <ConcurrencyConflictBanner
              onRefresh={showLatestFromOtherDevice}
              onCommitNewSnapshot={keepMyDraft}
            />
          ) : undefined
        }
        changes={editor.changes}
        versions={versions.versions}
        currentVersionNumber={versions.currentVersionNumber}
        currentVersion={versions.currentVersion}
        previousGuestCount={editor.previousGuestCount}
        syncStatus={versions.syncStatus}
        isReadOnly={isReadOnly}
        editKey={editKey}
        initialShareToken={initialShareToken}
        isExtracting={style.isExtracting}
        v2Banner={
          style.banner ? (
            <V2ChangeBanner
              rationale={style.banner.rationale}
              vibeStatement={editor.plan.styleDNA?.vibeStatement}
              onDismiss={style.dismissBanner}
            />
          ) : undefined
        }
        onGuestCountChange={editor.changeGuestCount}
        onSetProtected={editor.lockProtectedMoment}
        onApplyRemedy={editor.applyRemedy}
        onUndo={editor.undo}
        onRestoreVersion={restoreVersion}
        onUnlockEdit={onUnlockEdit}
        onRetuneStyle={style.retune}
        onResetToBaseline={style.resetToBaseline}
        onRetryExtraction={style.retry}
        onAdoptIdea={editor.adopt}
        onRetractIdea={editor.retract}
        onCommitQuote={editor.commitVendorQuote}
        onUnlockQuote={editor.unlockVendorQuote}
      />

      {/* Floating undo for the last bigger edit (D-14, IDEA-03, BUDGET-03) */}
      <UndoActionBar
        message={editor.quickUndo?.message ?? null}
        onUndo={editor.quickUndoLast}
        onDismiss={editor.dismissQuickUndo}
      />
    </>
  )
}
