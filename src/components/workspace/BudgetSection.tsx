'use client'

import React from 'react'
import { Wallet, Users, Coins } from 'lucide-react'
import type { BudgetCategory, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { BudgetLineRow } from './BudgetLineRow'
import { Button } from '@/components/ui/button'

interface BudgetSectionProps {
  plan: Plan
  onGuestCountChange: (newCount: number) => void
  onSetProtected: (category: BudgetCategory) => void
  onCheckQuote?: (category: BudgetCategory) => void
  onUnlockQuote?: (category: BudgetCategory) => void
  onOpenInspector?: () => void
  isReadOnly?: boolean
}

export function BudgetSection({
  plan,
  onGuestCountChange,
  onSetProtected,
  onCheckQuote,
  onUnlockQuote,
  onOpenInspector,
  isReadOnly = false,
}: BudgetSectionProps) {
  const { brief, lines, totalBudgetPaise } = plan
  const guestCount = brief.guestCount
  const costPerGuest = guestCount > 0 ? Math.round(totalBudgetPaise / guestCount) : 0

  return (
    <div className="flex flex-col gap-8">
      {/* One summary strip instead of three cards */}
      <dl className="grid grid-cols-2 border-y border-royal-plum/10 sm:grid-cols-3">
        <div className="col-span-2 border-b border-royal-plum/10 py-4 sm:col-span-1 sm:border-b-0">
          <dt className="flex items-center gap-1.5 text-sm text-royal-plum/60">
            <Wallet className="h-3.5 w-3.5 text-marigold" aria-hidden="true" />
            Total budget
          </dt>
          <dd className="mt-1 font-serif text-2xl font-bold tabular-nums text-royal-plum">
            {formatINR(totalBudgetPaise)}
          </dd>
        </div>

        <div className="py-4 pr-3 sm:border-l sm:border-royal-plum/10 sm:px-5">
          <dt className="flex items-center gap-1.5 text-sm text-royal-plum/60">
            <Users className="h-3.5 w-3.5 text-marigold" aria-hidden="true" />
            Guests
          </dt>
          <dd className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-serif text-2xl font-bold tabular-nums text-royal-plum">
              {guestCount}
            </span>
            {!isReadOnly && (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Remove 10 guests"
                  onClick={() => onGuestCountChange(Math.max(10, guestCount - 10))}
                  className="h-8 min-w-10 rounded-full border border-royal-plum/20 px-2.5 text-sm font-semibold tabular-nums text-royal-plum transition hover:border-royal-plum/40 hover:bg-royal-plum/5 motion-safe:active:scale-95"
                >
                  -10
                </button>
                <button
                  type="button"
                  aria-label="Add 10 guests"
                  onClick={() => onGuestCountChange(guestCount + 10)}
                  className="h-8 min-w-10 rounded-full border border-royal-plum/20 px-2.5 text-sm font-semibold tabular-nums text-royal-plum transition hover:border-royal-plum/40 hover:bg-royal-plum/5 motion-safe:active:scale-95"
                >
                  +10
                </button>
                <button
                  type="button"
                  aria-label="Add 500 guests"
                  onClick={() => onGuestCountChange(guestCount + 500)}
                  className="h-8 min-w-10 rounded-full border border-royal-plum/20 px-2.5 text-sm font-semibold tabular-nums text-royal-plum transition hover:border-royal-plum/40 hover:bg-royal-plum/5 motion-safe:active:scale-95"
                >
                  +500
                </button>
              </span>
            )}
          </dd>
          <p className="mt-1 text-sm text-royal-plum/60">Baseline: {plan.baselineGuestCount} guests</p>
        </div>

        <div className="border-l border-royal-plum/10 py-4 pl-4 sm:px-5">
          <dt className="flex items-center gap-1.5 text-sm text-royal-plum/60">
            <Coins className="h-3.5 w-3.5 text-marigold" aria-hidden="true" />
            Per guest
          </dt>
          <dd className="mt-1 font-serif text-2xl font-bold tabular-nums text-royal-plum">
            {formatINR(costPerGuest)}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="allocation-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h3 id="allocation-heading" className="flex items-center gap-2.5 font-serif text-xl font-bold text-royal-plum">
              <span aria-hidden="true" className="h-4 w-1 shrink-0 origin-bottom rounded-full bg-gradient-to-b from-marigold to-gulabi-rose motion-safe:animate-[mehfil-flourish_0.5s_cubic-bezier(0.22,1,0.36,1)_both]" />
              <span>Where the money goes</span>
            </h3>
            <p className="mt-0.5 text-sm text-royal-plum/60">
              {lines.length} categories. Shares always add up to the total, to the paisa.
            </p>
          </div>
          {onOpenInspector && (
            <Button type="button" variant="outline" size="sm" onClick={onOpenInspector} className="self-start">
              Smart Inspector
            </Button>
          )}
        </div>

        <ul className="mt-4 divide-y divide-royal-plum/10 border-y border-royal-plum/10">
          {lines.map((line) => {
            const displacedRecords = plan.adoptedIdeas?.flatMap((idea) =>
              idea.displacedDonors
                .filter((d) => d.lineId === line.id || d.category === line.category)
                .map((d) => ({
                  ideaTitle: idea.title,
                  displacedPaise: d.displacedPaise,
                }))
            )

            return (
              <BudgetLineRow
                key={line.id}
                line={line}
                totalBudgetPaise={totalBudgetPaise}
                onSetProtected={onSetProtected}
                displacedRecords={displacedRecords}
                onCheckQuote={onCheckQuote}
                onUnlockQuote={onUnlockQuote}
                isReadOnly={isReadOnly}
              />
            )
          })}
        </ul>
      </section>
    </div>
  )
}
