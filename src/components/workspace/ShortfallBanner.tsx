'use client'

import React from 'react'
import type { Plan, ShortfallRemedy } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { AlertTriangle, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    <Card
      data-testid="shortfall-banner"
      className="border-terracotta/40 bg-terracotta/5 text-royal-plum shadow-sm transition-all"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="rounded-full bg-terracotta/15 p-2 text-terracotta mt-0.5 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif font-bold text-base text-royal-plum">
                  Budget Balancing Shortfall: {formatINR(plan.shortfallPaise)}
                </h4>
                <Badge variant="destructive" className="bg-terracotta text-warm-ivory text-2xs">
                  ADR-0002 Permissive Mode
                </Badge>
              </div>
              <p className="mt-1 text-xs text-royal-plum/80 max-w-xl leading-relaxed">
                Guest count surge or idea adoptions have exceeded available flexible donor headroom.
                Your celebration plan remains fully editable and savable in Infeasible State (ADR-0002).
                Allocations are clamped to their 40% floors. Select any 1-click deterministic remedy below to resolve the deficit immediately:
              </p>
            </div>
          </div>

          {onUndo && previousGuestCount !== undefined && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={isReadOnly}
              className="inline-flex items-center gap-1.5 self-start border-terracotta/30 text-royal-plum hover:bg-terracotta/10 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo to {previousGuestCount} Guests</span>
            </Button>
          )}
        </div>

        {/* 1-Click Atomic Calculation Remedies (D-13, BUDGET-03) */}
        {plan.remedies && plan.remedies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-terracotta/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2.5">
              <ShieldAlert className="w-4 h-4 text-terracotta" />
              <span>1-Click Deterministic Remedies:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plan.remedies.map((remedy, idx) => (
                <div
                  key={idx}
                  data-testid={`remedy-card-${remedy.type}`}
                  className="flex flex-col justify-between rounded-xl border border-terracotta/20 bg-warm-ivory/90 p-3.5 shadow-xs"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-royal-plum">{remedy.title}</span>
                    <p className="text-xs text-royal-plum/70 leading-relaxed">{remedy.description}</p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isReadOnly}
                    onClick={() => handleRemedyClick(remedy)}
                    className="mt-3 inline-flex items-center justify-between text-xs font-semibold border-royal-plum/20 bg-white hover:bg-royal-plum/5 hover:border-royal-plum/40 active:scale-98 transition"
                  >
                    <span>{getRemedyButtonLabel(remedy)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-royal-plum/60" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
