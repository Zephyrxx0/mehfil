'use client'

import React from 'react'
import type { Plan, ShortfallRemedy } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ShortfallBannerProps {
  plan: Plan
  previousGuestCount?: number
  onApplyRemedy: (remedy: ShortfallRemedy) => void
  onUndo?: () => void
}

export function ShortfallBanner({
  plan,
  previousGuestCount,
  onApplyRemedy,
  onUndo,
}: ShortfallBannerProps) {
  if (!plan.isInfeasible || !plan.shortfallPaise) return null

  return (
    <Card className="border-terracotta/30 bg-terracotta/5 text-royal-plum shadow-sm transition-all">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="rounded-full bg-terracotta/15 p-2 text-terracotta mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-base text-royal-plum">
                  Budget Balancing Shortfall: {formatINR(plan.shortfallPaise)}
                </h4>
                <Badge variant="destructive">
                  ADR-0002 Permissive Mode
                </Badge>
              </div>
              <p className="mt-1 text-xs text-royal-plum/70 max-w-xl">
                Guest count scale exceeded available donor capacity without breaching the 40% floor on flexible lines.
                The celebration plan is displayed with minimum floors clamped. Choose a deterministic remedy below:
              </p>
            </div>
          </div>

          {onUndo && previousGuestCount !== undefined && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUndo}
              className="inline-flex items-center gap-1.5 self-start border-terracotta/30 text-royal-plum hover:bg-terracotta/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo to {previousGuestCount} Guests</span>
            </Button>
          )}
        </div>

        {/* Deterministic Remedies */}
        {plan.remedies && plan.remedies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-terracotta/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2">
              Recommended Balancing Actions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {plan.remedies.map((remedy, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-terracotta/20 bg-warm-ivory/80 p-3 shadow-xs"
                >
                  <div>
                    <span className="text-xs font-bold text-royal-plum">{remedy.title}</span>
                    <p className="mt-0.5 text-xs text-royal-plum/70">{remedy.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyRemedy(remedy)}
                    className="mt-2.5 inline-flex items-center justify-between text-xs font-semibold border-terracotta/20 hover:bg-terracotta/10"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3 h-3" />
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
