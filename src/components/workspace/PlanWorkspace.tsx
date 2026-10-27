'use client'

import React, { useState } from 'react'
import type { BudgetCategory, Plan, ShortfallRemedy } from '@/lib/engine/types'
import { rebalanceGuestCount, setProtectedMoment } from '@/lib/engine/budget'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { ShortfallBanner } from './ShortfallBanner'
import { BudgetSection } from './BudgetSection'
import { TimelineSection } from './TimelineSection'
import { Sparkles, Calendar, Coins, ArrowLeft } from 'lucide-react'

interface PlanWorkspaceProps {
  initialPlan: Plan
  onResetPlan?: () => void
}

export function PlanWorkspace({ initialPlan, onResetPlan }: PlanWorkspaceProps) {
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [previousGuestCount, setPreviousGuestCount] = useState<number | undefined>(
    initialPlan.baselineGuestCount
  )
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline'>('budget')

  // Calculate backwards timeline dynamically based on current guest count and date
  const schedule = calculateBackwardsTimeline(
    plan.brief.eventDate,
    plan.brief.guestCount
  )

  // Handle guest count scaling
  const handleGuestCountChange = (newCount: number) => {
    setPreviousGuestCount(plan.brief.guestCount)
    const rebalanced = rebalanceGuestCount(plan, newCount)
    setPlan(rebalanced)
  }

  // Handle 1-click Undo from ShortfallBanner (D-12)
  const handleUndo = () => {
    if (previousGuestCount !== undefined) {
      const restored = rebalanceGuestCount(plan, previousGuestCount)
      setPlan(restored)
    }
  }

  // Handle Protected Moment category reassignment (D-07, MOMENT-01)
  const handleSetProtected = (category: BudgetCategory) => {
    const updated = setProtectedMoment(plan, category)
    // Re-run rebalance to ensure invariant and immunity hold
    const rebalanced = rebalanceGuestCount(updated, updated.brief.guestCount)
    setPlan(rebalanced)
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
      const rebalanced = rebalanceGuestCount(updatedPlan, plan.brief.guestCount)
      setPlan(rebalanced)
    } else if (remedy.type === 'trim_elastic') {
      // Rebalancing already clamps to floors in permissive mode
      const rebalanced = rebalanceGuestCount(plan, plan.brief.guestCount)
      setPlan(rebalanced)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 py-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-royal-plum/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-marigold/20 px-2.5 py-0.5 text-xs font-bold text-royal-plum uppercase tracking-wider">
              {plan.brief.eventType}
            </span>
            <span className="text-xs text-royal-plum/50">• {plan.brief.city}</span>
            <span className="text-xs text-royal-plum/50">• {plan.brief.eventDate}</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-royal-plum">
            {plan.brief.title || 'Celebration Workspace'}
          </h1>
          <p className="text-xs text-royal-plum/60 mt-0.5">
            Mathematically guaranteed budget & timeline • Words from models, numbers from code
          </p>
        </div>

        {onResetPlan && (
          <button
            type="button"
            onClick={onResetPlan}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full border border-royal-plum/20 bg-white/80 px-4 py-2 text-xs font-semibold text-royal-plum shadow-xs hover:bg-white active:scale-95 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Celebration</span>
          </button>
        )}
      </div>

      {/* Shortfall Banner (Permissive Shortfall ADR-0002) */}
      <ShortfallBanner
        plan={plan}
        previousGuestCount={previousGuestCount}
        onApplyRemedy={handleApplyRemedy}
        onUndo={handleUndo}
      />

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-royal-plum/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'budget'
              ? 'bg-royal-plum text-warm-ivory shadow-xs'
              : 'text-royal-plum/70 hover:bg-royal-plum/5'
          }`}
        >
          <Coins className="w-4 h-4 text-marigold" />
          <span>Interactive Budget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'timeline'
              ? 'bg-royal-plum text-warm-ivory shadow-xs'
              : 'text-royal-plum/70 hover:bg-royal-plum/5'
          }`}
        >
          <Calendar className="w-4 h-4 text-marigold" />
          <span>Milestone Roadmap ({schedule.milestoneBands.length} Bands)</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'budget' ? (
        <BudgetSection
          plan={plan}
          onGuestCountChange={handleGuestCountChange}
          onSetProtected={handleSetProtected}
        />
      ) : (
        <TimelineSection plan={plan} schedule={schedule} />
      )}
    </div>
  )
}

