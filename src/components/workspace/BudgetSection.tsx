'use client'

import React from 'react'
import type { BudgetCategory, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { BudgetLineCard } from './BudgetLineCard'
import { Users, Coins, CheckCircle2, Shield } from 'lucide-react'

interface BudgetSectionProps {
  plan: Plan
  onGuestCountChange: (newCount: number) => void
  onSetProtected: (category: BudgetCategory) => void
}

export function BudgetSection({
  plan,
  onGuestCountChange,
  onSetProtected,
}: BudgetSectionProps) {
  const { brief, lines, totalBudgetPaise } = plan
  const guestCount = brief.guestCount
  const costPerGuest = guestCount > 0 ? Math.round(totalBudgetPaise / guestCount) : 0

  const linesTotal = lines.reduce((s, l) => s + l.currentPaise, 0)
  const isExactMatch = linesTotal === totalBudgetPaise

  return (
    <div className="flex flex-col gap-6">
      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Budget Card */}
        <div className="rounded-2xl border border-royal-plum/10 bg-white/70 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
            <Coins className="w-4 h-4 text-marigold" />
            <span>Total Budget</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-royal-plum">
              {formatINR(totalBudgetPaise)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-2xs text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>Integer Paise Invariant Guaranteed</span>
          </div>
        </div>

        {/* Guest Count Stepper Card */}
        <div className="rounded-2xl border border-royal-plum/10 bg-white/70 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
            <Users className="w-4 h-4 text-royal-plum/70" />
            <span>Guest Scale</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onGuestCountChange(Math.max(10, guestCount - 10))}
              className="rounded-lg border border-royal-plum/20 bg-warm-ivory px-2.5 py-1 text-sm font-bold text-royal-plum hover:bg-royal-plum/5 active:scale-95 transition"
            >
              -10
            </button>
            <span className="font-serif text-2xl font-bold text-royal-plum min-w-[3rem] text-center">
              {guestCount}
            </span>
            <button
              type="button"
              onClick={() => onGuestCountChange(guestCount + 10)}
              className="rounded-lg border border-royal-plum/20 bg-warm-ivory px-2.5 py-1 text-sm font-bold text-royal-plum hover:bg-royal-plum/5 active:scale-95 transition"
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => onGuestCountChange(guestCount + 500)}
              className="rounded-lg border border-royal-plum/20 bg-warm-ivory px-2 py-1 text-xs font-bold text-royal-plum hover:bg-royal-plum/5 active:scale-95 transition"
            >
              +500
            </button>
          </div>
          <div className="mt-1 text-2xs text-royal-plum/60">
            Baseline: {plan.baselineGuestCount} guests
          </div>
        </div>

        {/* Cost per Guest */}
        <div className="rounded-2xl border border-royal-plum/10 bg-white/70 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
            <Shield className="w-4 h-4 text-gulabi-rose" />
            <span>Per Guest Outlay</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-royal-plum">
              {formatINR(costPerGuest)}
            </span>
            <span className="text-xs text-royal-plum/50">/ guest</span>
          </div>
          <div className="mt-1 text-2xs text-royal-plum/60">
            Across all catering, favors & allocations
          </div>
        </div>
      </div>

      {/* Budget Allocation Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-royal-plum">
            Allocation Lines
          </h3>
          <span className="text-xs text-royal-plum/60">
            {lines.length} categories • Whole rupee display (D-10)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lines.map((line) => (
            <BudgetLineCard
              key={line.id}
              line={line}
              totalBudgetPaise={totalBudgetPaise}
              onSetProtected={onSetProtected}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
