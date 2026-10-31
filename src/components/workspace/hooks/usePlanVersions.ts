'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { computePlanDiff, type PlanDiffInput } from '@/lib/engine/diff'
import { createLogger } from '@/lib/logger'
import { persistence, type SavePlanResult } from '@/lib/storage/persistence'
import type { SyncState } from '../SyncStatusBadge'

const logger = createLogger('plan-versions')

/** How long rapid edits (sliders, steppers) wait before one version is saved. */
export const COMMIT_DEBOUNCE_MS = 800

type ActionType = PlanDiffInput['actionType']

interface VersionHead {
  id: string | undefined
  number: number
}

/** A save the server turned down because another device saved first. */
interface PlanConflict {
  /** The newest plan, as saved by the other device. */
  plan: Plan
  head: VersionHead | null
}

interface CommitOptions {
  /** Extra details kept with the version, such as the style DNA that produced it. */
  meta?: PlanVersionRecord['meta']
  /** Save on top of the newest version instead of the one this tab last saw. */
  ignoreConflicts?: boolean
}

export interface UsePlanVersionsOptions {
  initialPlan: Plan
  initialVersions?: PlanVersionRecord[]
  editKey?: string
  isReadOnly: boolean
}

function initialVersionList(initialPlan: Plan, given?: PlanVersionRecord[]): PlanVersionRecord[] {
  if (given && given.length > 0) return given
  return [
    {
      id: `ver-${initialPlan.id}-1`,
      eventId: initialPlan.id,
      versionNumber: 1,
      reason: 'Initial plan created from archetype',
      isFloorProtected: Boolean(initialPlan.brief.protectedCategory),
      snapshot: initialPlan,
      createdAt: new Date().toISOString(),
    },
  ]
}

function headOf(versions: PlanVersionRecord[]): VersionHead {
  const newest = versions.reduce((a, b) => (b.versionNumber > a.versionNumber ? b : a))
  return { id: newest.id, number: newest.versionNumber }
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
}: UsePlanVersionsOptions) {
  const [versions, setVersions] = useState(() => initialVersionList(initialPlan, initialVersions))
  const [head, setHead] = useState<VersionHead>(() => headOf(versions))
  const [syncStatus, setSyncStatus] = useState<SyncState>(editKey ? 'cloud_saved' : 'local_saved')
  const [conflict, setConflict] = useState<PlanConflict | null>(null)

  const headRef = useRef(head)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const debounce = useRef<{
    timer: ReturnType<typeof setTimeout>
    next: Plan
    burstStart: Plan
    actionType: ActionType
  } | null>(null)

  const moveHead = useCallback((next: VersionHead) => {
    headRef.current = next
    setHead(next)
  }, [])

  // Replace the placeholder history with the stored one.
  useEffect(() => {
    let isMounted = true
    persistence
      .getVersionHistory(initialPlan.id)
      .then((history) => {
        if (!isMounted || history.length === 0) return
        setVersions(history)
        moveHead(headOf(history))
      })
      .catch((err) => logger.warn('could not load version history', { err }))
    return () => {
      isMounted = false
    }
  }, [initialPlan.id, moveHead])

  /** Saves `nextPlan` as the next version. Resolves once storage has answered. */
  const commit = useCallback(
    (nextPlan: Plan, reason: string, options: CommitOptions = {}): Promise<void> => {
      if (isReadOnly) return Promise.resolve()
      setSyncStatus('syncing')

      const run = async () => {
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
          setConflict({
            plan: result.conflictPlan ?? nextPlan,
            head:
              result.versionId && result.versionNumber
                ? { id: result.versionId, number: result.versionNumber }
                : null,
          })
          setSyncStatus('local_saved')
          return
        }
        if (result.status === 'error') {
          logger.warn('save was not accepted', { error: result.error })
          setSyncStatus('local_saved')
          return
        }

        const number = result.versionNumber ?? headRef.current.number + 1
        const id = result.versionId ?? `ver-${nextPlan.id}-${number}`
        const record: PlanVersionRecord = {
          id,
          eventId: nextPlan.id,
          versionNumber: number,
          parentVersionId: headRef.current.id,
          reason,
          isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
          snapshot: nextPlan,
          meta: options.meta,
          createdAt: new Date().toISOString(),
        }
        setVersions((prev) => [record, ...prev.filter((v) => v.versionNumber !== number)])
        moveHead({ id, number })
        setConflict(null)
        setSyncStatus(result.status === 'saved_cloud' ? 'cloud_saved' : 'local_saved')
      }

      const queued = saveQueue.current.then(run)
      saveQueue.current = queued
      return queued
    },
    [editKey, isReadOnly, moveHead]
  )

  const flushPending = useCallback(() => {
    const pending = debounce.current
    if (!pending) return
    clearTimeout(pending.timer)
    debounce.current = null
    const { summary } = computePlanDiff({
      prevPlan: pending.burstStart,
      nextPlan: pending.next,
      actionType: pending.actionType,
    })
    void commit(pending.next, summary)
  }, [commit])

  /**
   * Saves after a short pause. A burst of edits becomes one version whose summary covers the
   * whole burst, because the diff starts from the plan as it was before the first edit.
   */
  const scheduleCommit = useCallback(
    (nextPlan: Plan, prevPlan: Plan, actionType?: ActionType) => {
      if (isReadOnly) return
      setSyncStatus('syncing')
      const burstStart = debounce.current?.burstStart ?? prevPlan
      if (debounce.current) clearTimeout(debounce.current.timer)
      debounce.current = {
        timer: setTimeout(flushPending, COMMIT_DEBOUNCE_MS),
        next: nextPlan,
        burstStart,
        actionType,
      }
    },
    [flushPending, isReadOnly]
  )

  // Leaving the page must not drop an edit that is still waiting for its pause.
  useEffect(() => {
    window.addEventListener('pagehide', flushPending)
    return () => {
      window.removeEventListener('pagehide', flushPending)
      flushPending()
    }
  }, [flushPending])

  /** The plan saved as `versionNumber`, if this tab has it. */
  const snapshotOf = useCallback(
    (versionNumber: number): Plan | undefined =>
      versions.find((v) => v.versionNumber === versionNumber)?.snapshot,
    [versions]
  )

  /** Cancels any waiting edit, so a restore or reset is not overwritten by it. */
  const discardPending = useCallback(() => {
    if (!debounce.current) return
    clearTimeout(debounce.current.timer)
    debounce.current = null
  }, [])

  /** Accepts the newer plan from the other device. Returns it so the caller can show it. */
  const acceptConflict = useCallback((): Plan | null => {
    if (!conflict) return null
    if (conflict.head) moveHead(conflict.head)
    setConflict(null)
    setSyncStatus('cloud_saved')
    // Pick up the other device's versions in the history tab.
    persistence
      .getVersionHistory(initialPlan.id)
      .then((history) => history.length > 0 && setVersions(history))
      .catch((err) => logger.warn('could not refresh version history', { err }))
    return conflict.plan
  }, [conflict, initialPlan.id, moveHead])

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
