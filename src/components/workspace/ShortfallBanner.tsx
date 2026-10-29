'use client'

import React from 'react'
import type { Plan, ShortfallRemedy } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Button } from '@/components/ui/button'

export interface ShortfallBannerProps {
  plan: Plan
  previousGuestCount?: number
  isReadOnly?: boolean
  onApplyRemedy: (remedy: ShortfallRemedy) => void
  onUndo?: () => void
}

export function ShortfallBanner({
  plan,
  previousGuestCount,
  isReadOnly = false,
  onApplyRemedy,
  onUndo,
}: ShortfallBannerProps) {
  if (!plan.isInfeasible || !plan.shortfallPaise) return null

  const handleRemedyClick = (remedy: ShortfallRemedy) => {
    if (isReadOnly) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50)
      } catch {
        // Safe fallback in unsupported contexts
      }
    }
    onApplyRemedy(remedy)
  }

  const getRemedyButtonLabel = (remedy: ShortfallRemedy): string => {
    switch (remedy.type) {
      case 'increase_budget':
        return `Add ${formatINR(remedy.deltaValue)} to Budget`
      case 'reduce_guests':
        return `Set Guests to ${remedy.deltaValue}`
      case 'trim_elastic':
        return 'Trim Flexible Lines'
      default:
        return 'Apply Remedy'
    }
  }

  return (
    <section
      data-testid="shortfall-banner"
      aria-labelledby="shortfall-heading"
      className="border-l-2 border-terracotta bg-terracotta/5 px-4 py-4 sm:px-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 id="shortfall-heading" className="font-serif text-lg font-bold text-royal-plum">
            Budget Balancing Shortfall: {formatINR(plan.shortfallPaise)}
          </h4>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-royal-plum/80">
            Guest count or idea adoptions have exceeded the flexible headroom. Your plan stays fully
            editable and savable (ADR-0002); allocations are held at their 40% floors. Pick a remedy
            to close the gap.
          </p>
        </div>

        {onUndo && previousGuestCount !== undefined && (
          <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={isReadOnly}>
            Undo to {previousGuestCount} Guests
          </Button>
        )}
      </div>

      {plan.remedies && plan.remedies.length > 0 && (
        <ul className="mt-3 divide-y divide-terracotta/20 border-t border-terracotta/20">
          {plan.remedies.map((remedy, idx) => (
            <li
              key={idx}
              data-testid={`remedy-card-${remedy.type}`}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-royal-plum">{remedy.title}</p>
                <p className="text-sm text-royal-plum/70">{remedy.description}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isReadOnly}
                onClick={() => handleRemedyClick(remedy)}
                className="shrink-0 self-start sm:self-center"
              >
                {getRemedyButtonLabel(remedy)}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
