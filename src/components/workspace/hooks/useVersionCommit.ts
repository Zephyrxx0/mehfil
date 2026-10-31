'use client'

import {
  useCallback,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'
import { persistence, type SavePlanResult } from '@/lib/storage/persistence'
import type { SyncState } from '../SyncStatusBadge'
import {
  conflictFrom,
  savedHead,
  versionRecordFor,
  withNewVersion,
  type CommitOptions,
  type PlanConflict,
  type VersionHead,
} from './planVersions'

const logger = createLogger('plan-versions')

export interface VersionCommitOptions {
  editKey?: string
  isReadOnly: boolean
  headRef: MutableRefObject<VersionHead>
  moveHead: (next: VersionHead) => void
  setVersions: Dispatch<SetStateAction<PlanVersionRecord[]>>
  setSyncStatus: Dispatch<SetStateAction<SyncState>>
  setConflict: Dispatch<SetStateAction<PlanConflict | null>>
}

/**
 * Saves a plan as the next version. Saves run one at a time, each against the version the
 * previous one produced, so two quick edits never send the same parent.
 */
export function useVersionCommit({
  editKey,
  isReadOnly,
  headRef,
  moveHead,
  setVersions,
  setSyncStatus,
  setConflict,
}: VersionCommitOptions) {
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  const run = useCallback(
    async (nextPlan: Plan, reason: string, options: CommitOptions) => {
      let result: SavePlanResult
      try {
        result = await persistence.savePlan(
          nextPlan,
          options.ignoreConflicts ? undefined : headRef.current.id,
          reason,
          editKey
        )
      } catch (err) {
        logger.error('save failed', { err })
        setSyncStatus('local_saved')
        return
      }

      if (result.status === 'conflict') {
        setConflict(conflictFrom(result, nextPlan))
        setSyncStatus('local_saved')
        return
      }
      if (result.status === 'error') {
        logger.warn('save was not accepted', { error: result.error })
        // A refused key means the cloud copy is behind; saying "Saved Locally" would hide that.
        setSyncStatus(result.error === 'edit_key_rejected' ? 'sync_paused' : 'local_saved')
        return
      }

      const parent = headRef.current
      const saved = savedHead(result, nextPlan, parent)
      const record = versionRecordFor({
        plan: nextPlan,
        reason,
        head: saved,
        parentId: parent.id,
        meta: options.meta,
      })
      setVersions((prev) => withNewVersion(prev, record))
      moveHead(saved)
      setConflict(null)
      setSyncStatus(result.status === 'saved_cloud' ? 'cloud_saved' : 'local_saved')
    },
    [editKey, headRef, moveHead, setConflict, setSyncStatus, setVersions]
  )

  /** Saves `nextPlan` as the next version. Resolves once storage has answered. */
  return useCallback(
    (nextPlan: Plan, reason: string, options: CommitOptions = {}): Promise<void> => {
      if (isReadOnly) return Promise.resolve()
      setSyncStatus('syncing')

      const queued = saveQueue.current.then(() => run(nextPlan, reason, options))
      saveQueue.current = queued
      return queued
    },
    [isReadOnly, run, setSyncStatus]
  )
}
