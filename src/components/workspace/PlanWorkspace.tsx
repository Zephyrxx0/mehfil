'use client'

import React, { useState } from 'react'
import type { BudgetCategory, Plan, ShortfallRemedy } from '@/lib/engine/types'
import { rebalanceGuestCount, setProtectedMoment } from '@/lib/engine/budget'
import { formatINR } from '@/lib/engine/currency'
import { WorkspaceShell } from './WorkspaceShell'
import type { PlanChangeRecord, PlanChangeDelta } from './ChangeExplainer'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface PlanWorkspaceProps {
  initialPlan: Plan
  onResetPlan?: () => void
  isReadOnly?: boolean
  editKey?: string
}

export function PlanWorkspace({ initialPlan, onResetPlan, isReadOnly, editKey }: PlanWorkspaceProps) {
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [previousGuestCount, setPreviousGuestCount] = useState<number | undefined>(
    initialPlan.baselineGuestCount
  )
  const [snapshotStack, setSnapshotStack] = useState<PlanChangeRecord[]>([])

  // Handle guest count scaling
  const handleGuestCountChange = (newCount: number) => {
    if (newCount === plan.brief.guestCount) return

    const prevGuest = plan.brief.guestCount
    setPreviousGuestCount(prevGuest)
    const nextPlan = rebalanceGuestCount(plan, newCount)

    // Calculate line-level deltas
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
  }

  // Handle 1-click Undo (D-12, D-15)
  const handleUndo = (item?: PlanChangeRecord, index?: number) => {
    if (item?.previousSnapshot) {
      setPlan(item.previousSnapshot)
      setPreviousGuestCount(item.previousSnapshot.brief.guestCount)
      const idx = index ?? snapshotStack.findIndex((s) => s.id === item.id)
      if (idx !== -1) {
        setSnapshotStack((prev) => prev.slice(idx + 1))
      }
      return
    }

    if (snapshotStack.length > 0) {
      const [latest, ...rest] = snapshotStack
      if (latest.previousSnapshot) {
        setPlan(latest.previousSnapshot)
        setPreviousGuestCount(latest.previousSnapshot.brief.guestCount)
        setSnapshotStack(rest)
        return
      }
    }

    if (previousGuestCount !== undefined) {
      const restored = rebalanceGuestCount(plan, previousGuestCount)
      setPlan(restored)
    }
  }

  // Handle Protected Moment category reassignment (D-07, MOMENT-01)
  const handleSetProtected = (category: BudgetCategory) => {
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
  }

  // Handle ADR-0002 shortfall remedies
  const handleApplyRemedy = (remedy: ShortfallRemedy) => {
    if (remedy.type === 'reduce_guests') {
      handleGuestCountChange(remedy.deltaValue)
    } else if (remedy.type === 'increase_budget') {
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
    } else if (remedy.type === 'trim_elastic') {
      const nextPlan = rebalanceGuestCount(plan, plan.brief.guestCount)
      setPlan(nextPlan)
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

      {/* Responsive Workspace Shell */}
      <WorkspaceShell
        plan={plan}
        changes={snapshotStack}
        previousGuestCount={previousGuestCount}
        onGuestCountChange={handleGuestCountChange}
        onSetProtected={handleSetProtected}
        onApplyRemedy={handleApplyRemedy}
        onUndo={handleUndo}
      />
    </div>
  )
}
