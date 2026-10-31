'use client'

import React, { useState } from 'react'
import type { BudgetCategory } from '@/lib/engine/types'
import { formatINR, parseINRInput } from '@/lib/engine/currency'
import { NumberStepper } from '@/components/ui/number-stepper'
import { cn } from '@/lib/utils'

interface StepScaleBudgetProps {
  guestCount: number
  rawBudgetInput: string
  protectedCategory: BudgetCategory
  onChange: (fields: {
    guestCount?: number
    rawBudgetInput?: string
    protectedCategory?: BudgetCategory
  }) => void
}

const CATEGORIES: { category: BudgetCategory; label: string }[] = [
  { category: 'catering', label: 'Catering & Feasts' },
  { category: 'venue', label: 'Venue & Staging' },
  { category: 'photo_film', label: 'Photography & Film' },
  { category: 'decor', label: 'Decor & Flowers' },
  { category: 'entertainment', label: 'Entertainment & Music' },
  { category: 'favors', label: 'Favors & Gifting' },
]

export function StepScaleBudget({
  guestCount,
  rawBudgetInput,
  protectedCategory,
  onChange,
}: StepScaleBudgetProps) {
  const [budgetError, setBudgetError] = useState<string | null>(null)

  let parsedPaise = 0
  try {
    parsedPaise = parseINRInput(rawBudgetInput)
  } catch {
    // typing in progress
  }

  const handleBudgetChange = (value: string) => {
    onChange({ rawBudgetInput: value })
    try {
      parseINRInput(value)
      setBudgetError(null)
    } catch {
      setBudgetError('Use numbers, or shorthand like 25L, 5L, or 1.5Cr')
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-7">
        {/* Guest Count */}
        <div>
          <label
            htmlFor="guest-count"
            className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2"
          >
            Expected Guest Count
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <NumberStepper
              id="guest-count"
              value={guestCount}
              min={10}
              max={5000}
              step={10}
              onChange={(n) => onChange({ guestCount: n })}
            />
            <div className="flex flex-wrap gap-1.5">
              {[50, 100, 200, 300, 500].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onChange({ guestCount: count })}
                  className={cn(
                    'h-8 rounded-full border px-3 text-xs font-medium tabular-nums transition',
                    guestCount === count
                      ? 'border-royal-plum bg-royal-plum text-warm-ivory'
                      : 'border-royal-plum/15 bg-white/60 text-royal-plum hover:bg-royal-plum/5'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-royal-plum/60">
            Per-guest categories (catering & favors) will scale dynamically with this number.
          </p>
        </div>

        {/* Total Budget */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="total-budget"
              className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70"
            >
              Total Target Budget
            </label>
            {parsedPaise > 0 && !budgetError && (
              <span className="rounded-md bg-marigold/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-royal-plum">
                {formatINR(parsedPaise)}
              </span>
            )}
          </div>
          <input
            id="total-budget"
            type="text"
            placeholder="e.g. 25L, 500000, 1.5Cr"
            value={rawBudgetInput}
            onChange={(e) => handleBudgetChange(e.target.value)}
            className={`h-11 w-full rounded-xl border bg-white/80 px-3.5 text-sm text-royal-plum transition focus:outline-none focus:ring-1 ${
              budgetError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                : 'border-royal-plum/15 hover:border-royal-plum/30 focus:border-royal-plum focus:ring-royal-plum'
            }`}
          />
          {budgetError ? (
            <p className="mt-2 text-xs text-red-600">{budgetError}</p>
          ) : (
            <p className="mt-2 text-xs text-royal-plum/60">
              Accepts authentic Indian shorthand: <strong>25L</strong> (₹25 Lakh),{' '}
              <strong>5L</strong>, or <strong>1.5Cr</strong>.
            </p>
          )}
        </div>
      </div>

      {/* Protected Moment */}
      <div>
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-royal-plum/70">
            Designate Your Protected Moment
          </span>
        </div>
        <p className="mb-3 text-xs text-royal-plum/60">
          Select the one non-negotiable celebration priority. The engine guarantees this line will{' '}
          <strong>never be trimmed</strong> during re-balancing.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((cat) => {
            const isProtected = protectedCategory === cat.category
            return (
              <button
                key={cat.category}
                type="button"
                aria-pressed={isProtected}
                onClick={() => onChange({ protectedCategory: cat.category })}
                className={`flex min-h-16 flex-col items-start justify-between gap-1 rounded-2xl border p-3.5 text-left text-sm font-medium transition ${
                  isProtected
                    ? 'border-gulabi-rose bg-gulabi-rose/20 font-semibold text-royal-plum ring-1 ring-gulabi-rose'
                    : 'border-royal-plum/10 bg-white/60 text-royal-plum/80 hover:border-royal-plum/30'
                }`}
              >
                <span>{cat.label}</span>
                {isProtected && <span className="text-xs font-semibold">Protected</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
