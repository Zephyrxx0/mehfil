'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'
import { persistence } from '@/lib/storage/persistence'
import { headOf, initialVersionList, type VersionHead } from './planVersions'

const logger = createLogger('plan-versions')

/**
 * The list of saved versions and the head (the version this tab builds on). The list starts
 * as a placeholder and is replaced by the stored history once it loads.
 */
export function useVersionHistory(initialPlan: Plan, initialVersions?: PlanVersionRecord[]) {
  const [versions, setVersions] = useState(() => initialVersionList(initialPlan, initialVersions))
  const [head, setHead] = useState<VersionHead>(() => headOf(versions))
  const headRef = useRef(head)

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

  /** Pulls the stored history again, to pick up versions another device saved. */
  const refreshVersions = useCallback(() => {
    persistence
      .getVersionHistory(initialPlan.id)
      .then((history) => history.length > 0 && setVersions(history))
      .catch((err) => logger.warn('could not refresh version history', { err }))
  }, [initialPlan.id])

  /** The plan saved as `versionNumber`, if this tab has it. */
  const snapshotOf = useCallback(
    (versionNumber: number): Plan | undefined =>
      versions.find((v) => v.versionNumber === versionNumber)?.snapshot,
    [versions]
  )

  return { versions, setVersions, head, headRef, moveHead, refreshVersions, snapshotOf }
}
