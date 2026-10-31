'use client'

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { Plan } from '@/lib/engine/types'
import type { SyncState } from '../SyncStatusBadge'
import {
  burstStartOf,
  COMMIT_DEBOUNCE_MS,
  summarizeBurst,
  type ActionType,
  type CommitOptions,
  type PendingCommit,
} from './planVersions'

export interface DebouncedCommitOptions {
  isReadOnly: boolean
  commit: (nextPlan: Plan, reason: string, options?: CommitOptions) => Promise<void>
  setSyncStatus: Dispatch<SetStateAction<SyncState>>
}

/**
 * Holds edits for a short pause and saves them as one version. Edits still waiting are
 * saved when the page is hidden or the component unmounts.
 */
export function useDebouncedCommit({ isReadOnly, commit, setSyncStatus }: DebouncedCommitOptions) {
  const debounce = useRef<PendingCommit | null>(null)

  const flushPending = useCallback(() => {
    const pending = debounce.current
    if (!pending) return
    clearTimeout(pending.timer)
    debounce.current = null
    void commit(pending.next, summarizeBurst(pending))
  }, [commit])

  /**
   * Saves after a short pause. A burst of edits becomes one version whose summary covers the
   * whole burst, because the diff starts from the plan as it was before the first edit.
   */
  const scheduleCommit = useCallback(
    (nextPlan: Plan, prevPlan: Plan, actionType?: ActionType) => {
      if (isReadOnly) return
      setSyncStatus('syncing')
      const burstStart = burstStartOf(debounce.current, prevPlan)
      if (debounce.current) clearTimeout(debounce.current.timer)
      debounce.current = {
        timer: setTimeout(flushPending, COMMIT_DEBOUNCE_MS),
        next: nextPlan,
        burstStart,
        actionType,
      }
    },
    [flushPending, isReadOnly, setSyncStatus]
  )

  // Leaving the page must not drop an edit that is still waiting for its pause.
  useEffect(() => {
    window.addEventListener('pagehide', flushPending)
    return () => {
      window.removeEventListener('pagehide', flushPending)
      flushPending()
    }
  }, [flushPending])

  /** Cancels any waiting edit, so a restore or reset is not overwritten by it. */
  const discardPending = useCallback(() => {
    if (!debounce.current) return
    clearTimeout(debounce.current.timer)
    debounce.current = null
  }, [])

  return { scheduleCommit, discardPending }
}
