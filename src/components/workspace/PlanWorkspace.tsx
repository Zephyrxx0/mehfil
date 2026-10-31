'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type {
  BudgetCategory,
  Plan,
  ShortfallRemedy,
  PlanVersionRecord,
  CuratedIdea,
} from '@/lib/engine/types'
import type { StyleDNA, StyleDimensions, AgentRunRecord } from '@/lib/ai/schemas'
import {
  rebalanceGuestCount,
  setProtectedMoment,
  adoptIdea,
  retractIdea,
  applyTrimElasticRemedy,
} from '@/lib/engine/budget'
import { detectEnvironmentalRisks } from '@/lib/engine/environmental'
import { formatINR } from '@/lib/engine/currency'
import { computePlanDiff } from '@/lib/engine/diff'
import { applyStyleModulationToPlan, generateStyleModulationRationale } from '@/lib/engine/style'
import { extractDeterministicStyleDNA } from '@/lib/ai/heuristic'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { persistence } from '@/lib/storage/persistence'
import { VIBE_MIN } from '@/lib/vibe-limits'
import { WorkspaceShell } from './WorkspaceShell'
import { ConcurrencyConflictBanner } from './ConcurrencyConflictBanner'
import { V2ChangeBanner } from './V2ChangeBanner'
import { UndoActionBar } from './UndoActionBar'
import type { SyncState } from './SyncStatusBadge'
import type { PlanChangeRecord, PlanChangeDelta } from './ChangeExplainer'
import type { PlanTabId } from './tabs'
import { createLogger } from '@/lib/logger'
import { createId } from '@/lib/id'
import { deterministicRunRecord } from '@/lib/ai/run-record'
const logger = createLogger('plan-workspace')

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
  const [plan, setPlan] = useState<Plan>(() => {
    if (initialPlan.environmentalAnalysis) return initialPlan
    const analysis = detectEnvironmentalRisks(
      initialPlan.brief.eventDate,
      initialPlan.brief.city,
      initialPlan.brief.eventType
    )
    return { ...initialPlan, environmentalAnalysis: analysis }
  })
  const [previousGuestCount, setPreviousGuestCount] = useState<number | undefined>(
    initialPlan.baselineGuestCount
  )
  const [snapshotStack, setSnapshotStack] = useState<PlanChangeRecord[]>([])
  const [undoState, setUndoState] = useState<{ message: string; previousPlan: Plan } | null>(null)

  // Two-Beat Reveal & Style DNA State (D-09, D-10, VIBE-04)
  const [isExtractingStyle, setIsExtractingStyle] = useState<boolean>(false)
  const [showV2Banner, setShowV2Banner] = useState<boolean>(false)
  const [v2Rationale, setV2Rationale] = useState<string>('')
  const hasTriggeredInitialExtraction = useRef(false)

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
        logger.warn('[PlanWorkspace] Failed to fetch version history:', err)
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

  // Two-Beat Reveal Application: applies Style DNA modulation to create v2
  const applyExtractedStyleDNA = useCallback(
    (styleDNA: StyleDNA, runRecord?: AgentRunRecord) => {
      const currentPlan = activePlanRef.current
      const prevPlan = currentPlan
      const modulatedPlan = applyStyleModulationToPlan(currentPlan, styleDNA)

      const deltas: PlanChangeDelta[] = []
      const styleDeltasForRationale: Array<{ category: BudgetCategory; deltaPaise: number }> = []

      for (const nextLine of modulatedPlan.lines) {
        const prevLine = prevPlan.lines.find((l) => l.id === nextLine.id)
        const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
        const deltaPaise = nextLine.currentPaise - prevPaise
        if (deltaPaise !== 0) {
          deltas.push({
            category: nextLine.name,
            deltaPaise,
          })
          styleDeltasForRationale.push({
            category: nextLine.category,
            deltaPaise,
          })
        }
      }

      const rationale = generateStyleModulationRationale(styleDNA, styleDeltasForRationale)
      const nextVerNum = currentVersionNumber + 1
      const nextVerId = `ver-${modulatedPlan.id}-${nextVerNum}`

      const v2Record: PlanVersionRecord = {
        id: nextVerId,
        eventId: modulatedPlan.id,
        versionNumber: nextVerNum,
        parentVersionId: currentVersionId,
        reason: rationale,
        isFloorProtected: Boolean(modulatedPlan.brief.protectedCategory),
        snapshot: modulatedPlan,
        meta: {
          run_record: runRecord,
          styleDNA,
        },
        createdAt: new Date().toISOString(),
      }

      setVersions((prev) => [v2Record, ...prev.filter((v) => v.versionNumber !== nextVerNum)])
      setCurrentVersionNumber(nextVerNum)
      setCurrentVersionId(nextVerId)
      setPlan(modulatedPlan)
      setV2Rationale(rationale)
      setShowV2Banner(true)

      // Add to legacy undo stack
      const record: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description: rationale,
        deltas,
        isFloorProtected: Boolean(modulatedPlan.brief.protectedCategory),
        previousSnapshot: prevPlan,
      }
      setSnapshotStack((prev) => [record, ...prev])

      // Commit to persistence
      if (!isReadOnly) {
        persistence.savePlan(modulatedPlan, currentVersionId, rationale, editKey)
      }
    },
    [currentVersionId, currentVersionNumber, editKey, isReadOnly]
  )

  // Trigger Style DNA Extraction API call
  const triggerStyleDNAExtraction = useCallback(
    async (swatchIds: string[], protectedMomentQuote?: string, tradeoffs?: any) => {
      setIsExtractingStyle(true)
      try {
        const response = await fetch('/api/style-dna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedSwatchIds: swatchIds,
            protectedMomentQuote: protectedMomentQuote || '',
            tradeoffs: tradeoffs || {
              feastVsSpectacle: 'feast',
              intimateVsGrand: 'intimate',
              heritageVsModern: 'heritage',
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`API responded with HTTP ${response.status}`)
        }

        const json = await response.json()
        if (json.success && json.data) {
          applyExtractedStyleDNA(json.data.styleDNA, json.data.runRecord)
        } else {
          throw new Error('API payload unsuccessful')
        }
      } catch (err) {
        logger.warn('[PlanWorkspace] Extraction error, applying Tier 3 heuristic locally:', err)
        const fallbackDNA = extractDeterministicStyleDNA(
          swatchIds,
          protectedMomentQuote || '',
          tradeoffs || {
            feastVsSpectacle: 'feast',
            intimateVsGrand: 'intimate',
            heritageVsModern: 'heritage',
          }
        )
        applyExtractedStyleDNA(fallbackDNA, deterministicRunRecord('client_fallback'))
      } finally {
        setIsExtractingStyle(false)
      }
    },
    [applyExtractedStyleDNA]
  )

  // Two-Beat Reveal Trigger: Beat 1 is instant baseline arrival (<10ms).
  // Once mounted, if vibeSwatches are present and styleDNA is not yet set, trigger Beat 2.
  useEffect(() => {
    if (
      plan.brief.vibeSwatches &&
      plan.brief.vibeSwatches.length >= VIBE_MIN &&
      !plan.styleDNA &&
      !hasTriggeredInitialExtraction.current
    ) {
      hasTriggeredInitialExtraction.current = true
      triggerStyleDNAExtraction(
        plan.brief.vibeSwatches,
        plan.brief.protectedMomentQuote,
        plan.brief.tradeoffs
      )
    }
  }, [
    plan.brief.vibeSwatches,
    plan.brief.protectedMomentQuote,
    plan.brief.tradeoffs,
    plan.styleDNA,
    triggerStyleDNAExtraction,
  ])

  // Handle Retuning Style DNA from Sliders Sheet (D-08, VIBE-04)
  const handleRetuneStyle = useCallback(
    (newDimensions: StyleDimensions) => {
      if (isReadOnly) return

      const currentDNA: StyleDNA = plan.styleDNA || {
        dimensions: newDimensions,
        namedPalette: [
          { name: 'Marigold Amber', hex: '#F7C873' },
          { name: 'Gulabi Rose', hex: '#F2A7B8' },
          { name: 'Royal Plum', hex: '#3A2442' },
          { name: 'Warm Ivory', hex: '#FFF8EE' },
        ],
        vibeStatement: plan.brief.vibeStatement || 'Calibrated custom aesthetic vibe.',
        protectedCategory: plan.brief.protectedCategory,
        protectedMomentQuote: plan.brief.protectedMomentQuote || '',
      }

      const retunedDNA: StyleDNA = {
        ...currentDNA,
        dimensions: newDimensions,
      }

      const prevPlan = plan
      const modulatedPlan = applyStyleModulationToPlan(plan, retunedDNA)

      const deltas: PlanChangeDelta[] = []
      const categoryDeltas: Array<{ category: BudgetCategory; deltaPaise: number }> = []

      for (const nextLine of modulatedPlan.lines) {
        const prevLine = prevPlan.lines.find((l) => l.id === nextLine.id)
        const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
        const deltaPaise = nextLine.currentPaise - prevPaise
        if (deltaPaise !== 0) {
          deltas.push({ category: nextLine.name, deltaPaise })
          categoryDeltas.push({ category: nextLine.category, deltaPaise })
        }
      }

      const rationale = generateStyleModulationRationale(retunedDNA, categoryDeltas)
      const nextVerNum = currentVersionNumber + 1
      const nextVerId = `ver-${modulatedPlan.id}-${nextVerNum}`

      const retunedRecord: PlanVersionRecord = {
        id: nextVerId,
        eventId: modulatedPlan.id,
        versionNumber: nextVerNum,
        parentVersionId: currentVersionId,
        reason: `Retuned Style: ${rationale}`,
        isFloorProtected: Boolean(modulatedPlan.brief.protectedCategory),
        snapshot: modulatedPlan,
        meta: {
          styleDNA: retunedDNA,
        },
        createdAt: new Date().toISOString(),
      }

      setVersions((prev) => [retunedRecord, ...prev])
      setCurrentVersionNumber(nextVerNum)
      setCurrentVersionId(nextVerId)
      setPlan(modulatedPlan)

      const changeRecord: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description: `Retuned Style: ${rationale}`,
        deltas,
        isFloorProtected: Boolean(modulatedPlan.brief.protectedCategory),
        previousSnapshot: prevPlan,
      }
      setSnapshotStack((prev) => [changeRecord, ...prev])

      persistence.savePlan(modulatedPlan, currentVersionId, `Retuned Style: ${rationale}`, editKey)
    },
    [currentVersionId, currentVersionNumber, editKey, isReadOnly, plan]
  )

  // Handle Reset to Baseline (v1) action (D-11, T-04-08)
  const handleResetToBaseline = useCallback(async () => {
    if (isReadOnly) return

    const v1Record = versions.find((v) => v.versionNumber === 1)
    let baselinePlan: Plan

    if (v1Record?.snapshot) {
      baselinePlan = {
        ...v1Record.snapshot,
        styleDNA: undefined,
        brief: {
          ...v1Record.snapshot.brief,
          vibeStatement: undefined,
        },
      }
    } else {
      baselinePlan = instantiatePlanFromBrief({
        ...plan.brief,
        vibeSwatches: undefined,
        protectedMomentQuote: undefined,
        vibeStatement: undefined,
      })
    }

    const nextVerNum = currentVersionNumber + 1
    const nextVerId = `ver-${plan.id}-${nextVerNum}`
    const reason = 'Reset celebration plan to baseline archetype (v1)'

    const newRecord: PlanVersionRecord = {
      id: nextVerId,
      eventId: plan.id,
      versionNumber: nextVerNum,
      parentVersionId: currentVersionId,
      reason,
      isFloorProtected: Boolean(baselinePlan.brief.protectedCategory),
      snapshot: baselinePlan,
      createdAt: new Date().toISOString(),
    }

    setVersions((prev) => [newRecord, ...prev])
    setCurrentVersionNumber(nextVerNum)
    setCurrentVersionId(nextVerId)
    setPlan(baselinePlan)
    setShowV2Banner(false)

    await persistence.savePlan(baselinePlan, currentVersionId, reason, editKey)
  }, [currentVersionId, currentVersionNumber, editKey, isReadOnly, plan, versions])

  // Handle Retry Extraction (D-14)
  const handleRetryExtraction = useCallback(async () => {
    const swatches = plan.brief.vibeSwatches || []
    const quote = plan.brief.protectedMomentQuote || ''
    const tradeoffs = plan.brief.tradeoffs
    if (swatches.length >= VIBE_MIN) {
      await triggerStyleDNAExtraction(swatches, quote, tradeoffs)
    }
  }, [
    plan.brief.protectedMomentQuote,
    plan.brief.tradeoffs,
    plan.brief.vibeSwatches,
    triggerStyleDNAExtraction,
  ])

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

      const nextVerNum = saveResult.versionNumber ?? currentVersionNumber + 1
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
      id: createId('change'),
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
      id: createId('change'),
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

  // Handle Curated Idea Adoption (IDEA-02, BUDGET-04, ADR-0004)
  const handleAdoptIdea = useCallback(
    (idea: CuratedIdea) => {
      if (isReadOnly) return
      const prevPlan = plan
      const nextPlan = adoptIdea(plan, idea)

      const deltas: PlanChangeDelta[] = []
      for (const nextLine of nextPlan.lines) {
        const prevLine = plan.lines.find((l) => l.id === nextLine.id)
        const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
        const deltaPaise = nextLine.currentPaise - prevPaise
        if (deltaPaise !== 0) {
          deltas.push({ category: nextLine.name, deltaPaise })
        }
      }

      const description = `Adopted ${idea.title} (${formatINR(idea.costPaise)})`
      const record: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description,
        deltas,
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        previousSnapshot: prevPlan,
      }

      setSnapshotStack((prev) => [record, ...prev])
      setPlan(nextPlan)
      setUndoState({ message: description, previousPlan: prevPlan })
      scheduleDebouncedCommit(nextPlan, prevPlan, 'budget_change')
    },
    [isReadOnly, plan, scheduleDebouncedCommit]
  )

  // Handle Curated Idea Retraction (IDEA-03, ADR-0004)
  const handleRetractIdea = useCallback(
    (ideaId: string) => {
      if (isReadOnly) return
      const prevPlan = plan
      const ideaTitle = plan.adoptedIdeas?.find((r) => r.ideaId === ideaId)?.title || 'idea'
      const nextPlan = retractIdea(plan, ideaId)

      const deltas: PlanChangeDelta[] = []
      for (const nextLine of nextPlan.lines) {
        const prevLine = plan.lines.find((l) => l.id === nextLine.id)
        const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
        const deltaPaise = nextLine.currentPaise - prevPaise
        if (deltaPaise !== 0) {
          deltas.push({ category: nextLine.name, deltaPaise })
        }
      }

      const description = `Retracted ${ideaTitle}`
      const record: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description,
        deltas,
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        previousSnapshot: prevPlan,
      }

      setSnapshotStack((prev) => [record, ...prev])
      setPlan(nextPlan)
      setUndoState({ message: description, previousPlan: prevPlan })
      scheduleDebouncedCommit(nextPlan, prevPlan, 'budget_change')
    },
    [isReadOnly, plan, scheduleDebouncedCommit]
  )

  // Handle ADR-0002 shortfall remedies (BUDGET-03, D-13)
  const handleApplyRemedy = (remedy: ShortfallRemedy) => {
    if (isReadOnly) return
    const prevPlan = plan

    if (remedy.type === 'reduce_guests') {
      handleGuestCountChange(remedy.deltaValue)
      setUndoState({
        message: `Applied remedy: Set Guests to ${remedy.deltaValue}`,
        previousPlan: prevPlan,
      })
    } else if (remedy.type === 'increase_budget') {
      const increasedBudget = plan.totalBudgetPaise + remedy.deltaValue
      const updatedPlan: Plan = {
        ...plan,
        totalBudgetPaise: increasedBudget,
        brief: { ...plan.brief, totalBudgetPaise: increasedBudget },
        isInfeasible: false,
        shortfallPaise: undefined,
        remedies: undefined,
      }
      const nextPlan = rebalanceGuestCount(updatedPlan, plan.brief.guestCount)
      const record: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description: `Increased total budget by ${formatINR(remedy.deltaValue)}`,
        deltas: [{ category: 'Total Budget', deltaPaise: remedy.deltaValue }],
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        previousSnapshot: prevPlan,
      }
      setSnapshotStack((prev) => [record, ...prev])
      setPlan(nextPlan)
      setUndoState({
        message: `Applied remedy: Added ${formatINR(remedy.deltaValue)} to Budget`,
        previousPlan: prevPlan,
      })
      scheduleDebouncedCommit(nextPlan, prevPlan, 'budget_change')
    } else if (remedy.type === 'trim_elastic') {
      const nextPlan = applyTrimElasticRemedy(plan, plan.shortfallPaise || 0)
      const deltas: PlanChangeDelta[] = []
      for (const nextLine of nextPlan.lines) {
        const prevLine = plan.lines.find((l) => l.id === nextLine.id)
        const prevPaise = prevLine ? prevLine.currentPaise : nextLine.baselinePaise
        const deltaPaise = nextLine.currentPaise - prevPaise
        if (deltaPaise !== 0) {
          deltas.push({ category: nextLine.name, deltaPaise })
        }
      }
      const record: PlanChangeRecord = {
        id: createId('change'),
        timestamp: new Date(),
        description: 'Applied remedy: Trimmed flexible lines to their floors',
        deltas,
        isFloorProtected: Boolean(nextPlan.brief.protectedCategory),
        previousSnapshot: prevPlan,
      }
      setSnapshotStack((prev) => [record, ...prev])
      setPlan(nextPlan)
      setUndoState({
        message: 'Applied remedy: Trimmed flexible lines',
        previousPlan: prevPlan,
      })
      scheduleDebouncedCommit(nextPlan, prevPlan, 'budget_change')
    }
  }

  // Handle Tier 1 Instant Floating Undo (D-14)
  const handleTier1Undo = useCallback(() => {
    if (!undoState) return
    const restored = undoState.previousPlan
    const current = plan
    setPlan(restored)
    scheduleDebouncedCommit(restored, current, 'restore')
    setUndoState(null)
  }, [plan, scheduleDebouncedCommit, undoState])

  // Handle Forward Restore Undo (D-10, D-11, COLLAB-04)
  const handleRestoreVersion = async (targetVersionNumber: number) => {
    if (isReadOnly) return

    const targetVersion = versions.find((v) => v.versionNumber === targetVersionNumber)
    if (!targetVersion) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const restoredPlan: Plan = targetVersion.snapshot
      ? { ...targetVersion.snapshot }
      : {
          ...plan,
          lines: (targetVersion as any).lines || plan.lines,
          totalBudgetPaise:
            (targetVersion as any).totals?.totalBudgetPaise || plan.totalBudgetPaise,
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

    const nextVerNum = saveResult.versionNumber ?? currentVersionNumber + 1
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
    <>
      <WorkspaceShell
        plan={plan}
        activeTab={activeTab}
        basePath={basePath}
        notices={
          concurrencyConflict ? (
            <ConcurrencyConflictBanner
              onRefresh={handleRefreshToLatest}
              onCommitNewSnapshot={handleCommitAsNewSnapshot}
            />
          ) : undefined
        }
        changes={snapshotStack}
        versions={versions}
        currentVersionNumber={currentVersionNumber}
        currentVersion={
          versions.find((v) => v.versionNumber === currentVersionNumber) || versions[0]
        }
        previousGuestCount={previousGuestCount}
        syncStatus={syncStatus}
        isReadOnly={isReadOnly}
        editKey={editKey}
        initialShareToken={initialShareToken}
        isExtracting={isExtractingStyle}
        v2Banner={
          showV2Banner && v2Rationale ? (
            <V2ChangeBanner
              rationale={v2Rationale}
              vibeStatement={plan.styleDNA?.vibeStatement}
              onDismiss={() => setShowV2Banner(false)}
            />
          ) : undefined
        }
        onGuestCountChange={handleGuestCountChange}
        onSetProtected={handleSetProtected}
        onApplyRemedy={handleApplyRemedy}
        onUndo={handleUndo}
        onRestoreVersion={handleRestoreVersion}
        onUnlockEdit={onUnlockEdit}
        onRetuneStyle={handleRetuneStyle}
        onResetToBaseline={handleResetToBaseline}
        onRetryExtraction={handleRetryExtraction}
        onAdoptIdea={handleAdoptIdea}
        onRetractIdea={handleRetractIdea}
      />

      {/* Tier 1 Floating Instant Undo Action Bar (D-14, IDEA-03, BUDGET-03) */}
      <UndoActionBar
        message={undoState?.message || null}
        onUndo={handleTier1Undo}
        onDismiss={() => setUndoState(null)}
      />
    </>
  )
}
