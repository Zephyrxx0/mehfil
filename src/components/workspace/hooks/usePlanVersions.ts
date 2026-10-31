'use client'

import { useCallback, useState } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { SyncState } from '../SyncStatusBadge'
import { COMMIT_DEBOUNCE_MS, type PlanConflict } from './planVersions'
import { useDebouncedCommit } from './useDebouncedCommit'
import { useVersionCommit } from './useVersionCommit'
import { useVersionHistory } from './useVersionHistory'

export { COMMIT_DEBOUNCE_MS }

export interface UsePlanVersionsOptions {
  initialPlan: Plan
  initialVersions?: PlanVersionRecord[]
  editKey?: string
  isReadOnly: boolean
  /** The cloud did not confirm this plan on load, so the device copy may be ahead of it. */
  cloudUnconfirmed?: boolean
}

/**
 * Owns the version history of a plan and every save to storage.
 *
 * Saves run one at a time, each against the version the previous one produced, so two quick
 * edits never send the same parent. The head always comes from what storage answered with,
 * never from an id invented in the browser.
 */
export function usePlanVersions({
  initialPlan,
  initialVersions,
  editKey,
  isReadOnly,
  cloudUnconfirmed = false,
}: UsePlanVersionsOptions) {
  const history = useVersionHistory(initialPlan, initialVersions)
  const { versions, setVersions, head, headRef, moveHead, refreshVersions, snapshotOf } = history
  const [syncStatus, setSyncStatus] = useState<SyncState>(
    cloudUnconfirmed ? 'sync_paused' : editKey ? 'cloud_saved' : 'local_saved'
  )
  const [conflict, setConflict] = useState<PlanConflict | null>(null)

  const commit = useVersionCommit({
    editKey,
    isReadOnly,
    headRef,
    moveHead,
    setVersions,
    setSyncStatus,
    setConflict,
  })
  const { scheduleCommit, discardPending } = useDebouncedCommit({
    isReadOnly,
    commit,
    setSyncStatus,
  })

  /** Accepts the newer plan from the other device. Returns it so the caller can show it. */
  const acceptConflict = useCallback((): Plan | null => {
    if (!conflict) return null
    if (conflict.head) moveHead(conflict.head)
    setConflict(null)
    setSyncStatus('cloud_saved')
    // Pick up the other device's versions in the history tab.
    refreshVersions()
    return conflict.plan
  }, [conflict, moveHead, refreshVersions])

  const currentVersion = versions.find((v) => v.versionNumber === head.number) ?? versions[0]

  return {
    versions,
    currentVersion,
    currentVersionNumber: head.number,
    syncStatus,
    conflict,
    commit,
    scheduleCommit,
    discardPending,
    snapshotOf,
    acceptConflict,
  }
}
