'use client'

import React, { useState } from 'react'
import type { BudgetCategory } from '@/lib/engine/types'
import { formatINR, parseINRInput } from '@/lib/engine/currency'
import { ShieldCheck } from 'lucide-react'

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
    <div className="flex flex-col gap-5">
      {/* Guest Count */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-1.5">
          Expected Guest Count
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={10}
            max={5000}
            value={guestCount || ''}
            onChange={(e) => onChange({ guestCount: Math.max(1, parseInt(e.target.value) || 0) })}
            className="w-40 rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 py-2 text-sm text-royal-plum focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
          />
          <div className="flex gap-1.5">
            {[50, 100, 200, 300, 500].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onChange({ guestCount: count })}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  guestCount === count
                    ? 'border-royal-plum bg-royal-plum text-warm-ivory'
                    : 'border-royal-plum/15 bg-white/60 text-royal-plum hover:bg-royal-plum/5'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-royal-plum/60">
          Per-guest categories (catering & favors) will scale dynamically with this number.
        </p>
      </div>

      {/* Total Budget */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70">
            Total Target Budget
          </label>
          {parsedPaise > 0 && !budgetError && (
            <span className="text-xs font-semibold text-royal-plum bg-marigold/20 px-2 py-0.5 rounded-md">
              {formatINR(parsedPaise)}
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder="e.g. 25L, 500000, 1.5Cr"
          value={rawBudgetInput}
          onChange={(e) => handleBudgetChange(e.target.value)}
          className={`w-full rounded-xl border bg-white/80 px-3.5 py-2 text-sm text-royal-plum focus:outline-none focus:ring-1 ${
            budgetError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
              : 'border-royal-plum/15 focus:border-royal-plum focus:ring-royal-plum'
          }`}
        />
        {budgetError ? (
          <p className="mt-1 text-xs text-red-600">{budgetError}</p>
        ) : (
          <p className="mt-1 text-xs text-royal-plum/60">
            Accepts authentic Indian shorthand: <strong>25L</strong> (₹25 Lakh), <strong>5L</strong>, or <strong>1.5Cr</strong>.
          </p>
        )}
      </div>

      {/* Protected Moment */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-gulabi-rose" />
          <label className="text-xs font-semibold uppercase tracking-wider text-royal-plum/70">
            Designate Your Protected Moment (ADR-0004)
          </label>
        </div>
        <p className="text-xs text-royal-plum/60 mb-2.5">
          Select the one non-negotiable celebration priority. The engine guarantees this line will{' '}
          <strong>never be trimmed</strong> during re-balancing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const isProtected = protectedCategory === cat.category
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => onChange({ protectedCategory: cat.category })}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-medium transition ${
                  isProtected
                    ? 'border-gulabi-rose bg-gulabi-rose/20 text-royal-plum font-semibold ring-1 ring-gulabi-rose'
                    : 'border-royal-plum/10 bg-white/60 text-royal-plum/80 hover:border-royal-plum/30'
                }`}
              >
                <span>{cat.label}</span>
                {isProtected && <span className="text-xs text-gulabi-rose">★</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
