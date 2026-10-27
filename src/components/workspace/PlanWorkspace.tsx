'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { BudgetCategory, Plan, ShortfallRemedy, PlanVersionRecord } from '@/lib/engine/types'
import { rebalanceGuestCount, setProtectedMoment } from '@/lib/engine/budget'
import { formatINR } from '@/lib/engine/currency'
import { computePlanDiff } from '@/lib/engine/diff'
import { persistence } from '@/lib/storage/persistence'
import { WorkspaceShell } from './WorkspaceShell'
import { ConcurrencyConflictBanner } from './ConcurrencyConflictBanner'
import type { SyncState } from './SyncStatusBadge'
import type { PlanChangeRecord, PlanChangeDelta } from './ChangeExplainer'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface PlanWorkspaceProps {
  initialPlan: Plan
  onResetPlan?: () => void
  isReadOnly?: boolean
  editKey?: string
  initialVersions?: PlanVersionRecord[]
  initialShareToken?: string
  onUnlockEdit?: () => void
}

export function PlanWorkspace({
  initialPlan,
  onResetPlan,
  isReadOnly = false,
  editKey,
  initialVersions,
  initialShareToken,
  onUnlockEdit,
}: PlanWorkspaceProps) {
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [previousGuestCount, setPreviousGuestCount] = useState<number | undefined>(
    initialPlan.baselineGuestCount
  )
  const [snapshotStack, setSnapshotStack] = useState<PlanChangeRecord[]>([])
  
  // Versions & Sync state (D-09, D-10, D-14, D-15)
  const [versions, setVersions] = useState<PlanVersionRecord[]>(() => {
    if (initialVersions && initialVersions.length > 0) return initialVersions
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
  })
  
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(() => {
    if (initialVersions && initialVersions.length > 0) {
      return Math.max(...initialVersions.map((v) => v.versionNumber))
    }
    return 1
  })
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>(() => {
    if (initialVersions && initialVersions.length > 0) {
      return initialVersions[0]?.id
    }
    return `ver-${initialPlan.id}-1`
  })

  const [syncStatus, setSyncStatus] = useState<SyncState>(editKey ? 'cloud_saved' : 'local_saved')
  const [concurrencyConflict, setConcurrencyConflict] = useState<Plan | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activePlanRef = useRef<Plan>(plan)
  activePlanRef.current = plan

  // Fetch cloud version history on mount if available
  useEffect(() => {
    let isMounted = true
    async function loadHistory() {
      try {
        const history = await persistence.getVersionHistory(initialPlan.id)
        if (isMounted && history && history.length > 0) {
          setVersions(history)
          const latest = history[0]
          if (latest) {
            setCurrentVersionNumber(latest.versionNumber)
            setCurrentVersionId(latest.id)
          }
        }
      } catch (err) {
        console.warn('[PlanWorkspace] Failed to fetch version history:', err)
      }
    }
    loadHistory()
    return () => {
      isMounted = false
    }
  }, [initialPlan.id])

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Core commit worker: computes diff and commits to persistence
  const commitPlan = useCallback(
    async (
      nextPlan: Plan,
      prevPlan: Plan,
      actionType?: 'guest_scale' | 'budget_change' | 'protected_lock' | 'restore' | 'manual'
    ) => {
      if (isReadOnly) return

      const diffResult = computePlanDiff({
        prevPlan,
        nextPlan,
        actionType,
      })

      const saveResult = await persistence.savePlan(
        nextPlan,
        currentVersionId,
        diffResult.summary,
        editKey
      )

      if (saveResult.status === 'conflict') {
        setConcurrencyConflict(saveResult.conflictPlan || nextPlan)
        return
      }

      const nextVerNum = saveResult.versionNumber ?? (currentVersionNumber + 1)
      const nextVerId = saveResult.versionId ?? `ver-${nextPlan.id}-${nextVerNum}`

      const newRecord: PlanVersionRecord = {
        id: nextVerId,
        eventId: nextPlan.id,
        versionNumber: nextVerNum,
        parentVersionId: currentVersionId,
        reason: diffResult.summary,
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        snapshot: nextPlan,
        createdAt: new Date().toISOString(),
      }

      setVersions((prev) => [newRecord, ...prev.filter((v) => v.versionNumber !== nextVerNum)])
      setCurrentVersionNumber(nextVerNum)
      setCurrentVersionId(nextVerId)
      setSyncStatus(saveResult.status === 'saved_cloud' ? 'cloud_saved' : 'local_saved')
      setConcurrencyConflict(null)
    },
    [currentVersionId, currentVersionNumber, editKey, isReadOnly]
  )

  // Debounced queue trigger (800ms) for high-frequency slider/stepper edits
  const scheduleDebouncedCommit = useCallback(
    (
      nextPlan: Plan,
      prevPlan: Plan,
      actionType?: 'guest_scale' | 'budget_change' | 'protected_lock' | 'restore' | 'manual'
    ) => {
      if (isReadOnly) return

      setSyncStatus('syncing')
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        commitPlan(nextPlan, prevPlan, actionType)
      }, 800)
    },
    [commitPlan, isReadOnly]
  )

  // Handle guest count scaling
  const handleGuestCountChange = (newCount: number) => {
    if (newCount === plan.brief.guestCount) return

    const prevPlan = plan
    const prevGuest = plan.brief.guestCount
    setPreviousGuestCount(prevGuest)
    const nextPlan = rebalanceGuestCount(plan, newCount)

    // Calculate line-level deltas for legacy stack
    const deltas: PlanChangeDelta[] = []
    for (const nextLine of nextPlan.lines) {
      const prevLine = plan.lines.find((l) => l.id === nextLine.id)
      const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
      const deltaPaise = nextLine.currentPaise - prevPaise
      if (deltaPaise !== 0) {
        deltas.push({
          category: nextLine.name,
          deltaPaise,
        })
      }
    }

    const guestDelta = newCount - prevGuest
    const description =
      guestDelta > 0
        ? `Scaled guest count from ${prevGuest} to ${newCount} (+${guestDelta} guests)`
        : `Scaled guest count from ${prevGuest} to ${newCount} (${guestDelta} guests)`

    const record: PlanChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
      description,
      deltas,
      isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
      previousSnapshot: plan,
    }

    setSnapshotStack((prev) => [record, ...prev])
    setPlan(nextPlan)

    scheduleDebouncedCommit(nextPlan, prevPlan, 'guest_scale')
  }

  // Handle 1-click Undo (legacy or single step)
  const handleUndo = (item?: PlanChangeRecord, index?: number) => {
    if (item?.previousSnapshot) {
      const nextPlan = item.previousSnapshot
      const prevPlan = plan
      setPlan(nextPlan)
      setPreviousGuestCount(item.previousSnapshot.brief.guestCount)
      const idx = index ?? snapshotStack.findIndex((s) => s.id === item.id)
      if (idx !== -1) {
        setSnapshotStack((prev) => prev.slice(idx + 1))
      }
      scheduleDebouncedCommit(nextPlan, prevPlan, 'guest_scale')
      return
    }

    if (snapshotStack.length > 0) {
      const [latest, ...rest] = snapshotStack
      if (latest.previousSnapshot) {
        const nextPlan = latest.previousSnapshot
        const prevPlan = plan
        setPlan(nextPlan)
        setPreviousGuestCount(latest.previousSnapshot.brief.guestCount)
        setSnapshotStack(rest)
        scheduleDebouncedCommit(nextPlan, prevPlan, 'guest_scale')
        return
      }
    }

    if (previousGuestCount !== undefined) {
      const prevPlan = plan
      const restored = rebalanceGuestCount(plan, previousGuestCount)
      setPlan(restored)
      scheduleDebouncedCommit(restored, prevPlan, 'guest_scale')
    }
  }

  // Handle Protected Moment category reassignment (D-07, MOMENT-01)
  const handleSetProtected = (category: BudgetCategory) => {
    const prevPlan = plan
    const updated = setProtectedMoment(plan, category)
    const nextPlan = rebalanceGuestCount(updated, updated.brief.guestCount)

    const deltas: PlanChangeDelta[] = []
    for (const nextLine of nextPlan.lines) {
      const prevLine = plan.lines.find((l) => l.id === nextLine.id)
      const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
      const deltaPaise = nextLine.currentPaise - prevPaise
      if (deltaPaise !== 0) {
        deltas.push({
          category: nextLine.name,
          deltaPaise,
        })
      }
    }

    const record: PlanChangeRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
      description: `Locked Protected Moment for ${category.replace('_', ' ')} (floor locked)`,
      deltas,
      isFloorProtected: true,
      previousSnapshot: plan,
    }

    setSnapshotStack((prev) => [record, ...prev])
    setPlan(nextPlan)

    scheduleDebouncedCommit(nextPlan, prevPlan, 'protected_lock')
  }

  // Handle ADR-0002 shortfall remedies
  const handleApplyRemedy = (remedy: ShortfallRemedy) => {
    if (remedy.type === 'reduce_guests') {
      handleGuestCountChange(remedy.deltaValue)
    } else if (remedy.type === 'increase_budget') {
      const prevPlan = plan
      const increasedBudget = plan.totalBudgetPaise + remedy.deltaValue
      const updatedPlan: Plan = {
        ...plan,
        totalBudgetPaise: increasedBudget,
        brief: { ...plan.brief, totalBudgetPaise: increasedBudget },
      }
      const nextPlan = rebalanceGuestCount(updatedPlan, plan.brief.guestCount)
      const record: PlanChangeRecord = {
        id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date(),
        description: `Increased total budget by ${formatINR(remedy.deltaValue)}`,
        deltas: [{ category: 'Total Budget', deltaPaise: remedy.deltaValue }],
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        previousSnapshot: plan,
      }
      setSnapshotStack((prev) => [record, ...prev])
      setPlan(nextPlan)
      scheduleDebouncedCommit(nextPlan, prevPlan, 'budget_change')
    } else if (remedy.type === 'trim_elastic') {
      const prevPlan = plan
      const nextPlan = rebalanceGuestCount(plan, plan.brief.guestCount)
      setPlan(nextPlan)
      scheduleDebouncedCommit(nextPlan, prevPlan, 'budget_change')
    }
  }

  // Handle Forward Restore Undo (D-10, D-11, COLLAB-04)
  const handleRestoreVersion = async (targetVersionNumber: number) => {
    if (isReadOnly) return

    const targetVersion = versions.find((v) => v.versionNumber === targetVersionNumber)
    if (!targetVersion) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const prevPlan = plan
    const restoredPlan: Plan = targetVersion.snapshot ? { ...targetVersion.snapshot } : {
      ...plan,
      lines: (targetVersion as any).lines || plan.lines,
      totalBudgetPaise: (targetVersion as any).totals?.totalBudgetPaise || plan.totalBudgetPaise,
    }

    setPlan(restoredPlan)
    setSyncStatus('syncing')

    // Commit immediately as new forward version
    const saveResult = await persistence.savePlan(
      restoredPlan,
      currentVersionId,
      `Reverted to v${targetVersionNumber}`,
      editKey
    )

    if (saveResult.status === 'conflict') {
      setConcurrencyConflict(saveResult.conflictPlan || restoredPlan)
      return
    }

    const nextVerNum = saveResult.versionNumber ?? (currentVersionNumber + 1)
    const nextVerId = saveResult.versionId ?? `ver-${restoredPlan.id}-${nextVerNum}`

    const newRecord: PlanVersionRecord = {
      id: nextVerId,
      eventId: restoredPlan.id,
      versionNumber: nextVerNum,
      parentVersionId: currentVersionId,
      reason: `Reverted to v${targetVersionNumber}`,
      isFloorProtected: Boolean(restoredPlan.brief.protectedCategory),
      snapshot: restoredPlan,
      createdAt: new Date().toISOString(),
    }

    setVersions((prev) => [newRecord, ...prev])
    setCurrentVersionNumber(nextVerNum)
    setCurrentVersionId(nextVerId)
    setSyncStatus(saveResult.status === 'saved_cloud' ? 'cloud_saved' : 'local_saved')
    setConcurrencyConflict(null)
  }

  // Concurrency conflict handlers (D-15)
  const handleRefreshToLatest = () => {
    if (concurrencyConflict) {
      setPlan(concurrencyConflict)
      setConcurrencyConflict(null)
      setSyncStatus('cloud_saved')
    }
  }

  const handleCommitAsNewSnapshot = async () => {
    if (concurrencyConflict) {
      setSyncStatus('syncing')
      // Save without parentVersionId or using conflict plan's version to bypass conflict check
      const saveResult = await persistence.savePlan(
        plan,
        undefined,
        'Force saved local draft snapshot',
        editKey
      )
      setConcurrencyConflict(null)
      if (saveResult.status === 'saved_cloud') {
        setSyncStatus('cloud_saved')
      } else {
        setSyncStatus('local_saved')
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-royal-plum/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="uppercase tracking-wider">
              {plan.brief.eventType}
            </Badge>
            <span className="text-xs text-royal-plum/50">• {plan.brief.city}</span>
            <span className="text-xs text-royal-plum/50">• {plan.brief.eventDate}</span>
            <span className="text-xs text-royal-plum/70 font-semibold tabular-nums">
              • {formatINR(plan.totalBudgetPaise)}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-royal-plum">
            {plan.brief.title || 'Celebration Workspace'}
          </h1>
          <p className="text-xs text-royal-plum/60 mt-0.5">
            Mathematically guaranteed budget & timeline • Words from models, numbers from code
          </p>
        </div>

        {onResetPlan && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetPlan}
            className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Celebration</span>
          </Button>
        )}
      </div>

      {/* Optimistic Concurrency Conflict Banner (D-15, COLLAB-04) */}
      {concurrencyConflict && (
        <ConcurrencyConflictBanner
          onRefresh={handleRefreshToLatest}
          onCommitNewSnapshot={handleCommitAsNewSnapshot}
        />
      )}

      {/* Responsive Workspace Shell */}
      <WorkspaceShell
        plan={plan}
        changes={snapshotStack}
        versions={versions}
        currentVersionNumber={currentVersionNumber}
        previousGuestCount={previousGuestCount}
        syncStatus={syncStatus}
        isReadOnly={isReadOnly}
        editKey={editKey}
        initialShareToken={initialShareToken}
        onGuestCountChange={handleGuestCountChange}
        onSetProtected={handleSetProtected}
        onApplyRemedy={handleApplyRemedy}
        onUndo={handleUndo}
        onRestoreVersion={handleRestoreVersion}
        onUnlockEdit={onUnlockEdit}
      />
    </div>
  )
}
