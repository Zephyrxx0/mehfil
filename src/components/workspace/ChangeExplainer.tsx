import React from 'react'
import type { Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { RotateCcw, ShieldCheck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface PlanChangeDelta {
  category: string
  deltaPaise: number
}

export interface PlanChangeRecord {
  id: string
  timestamp: Date
  description: string
  deltas: PlanChangeDelta[]
  isFloorProtected?: boolean
  previousSnapshot?: Plan
}

export interface ChangeExplainerProps {
  plan?: Plan
  changes?: PlanChangeRecord[]
  history?: PlanChangeRecord[]
  previousGuestCount?: number
  onUndo?: (item: PlanChangeRecord, index: number) => void
  className?: string
}

export function ChangeExplainer({
  plan,
  changes,
  history,
  previousGuestCount,
  onUndo,
  className,
}: ChangeExplainerProps) {
  // Use changes, or history, or empty list
  const changeList: PlanChangeRecord[] = changes ?? history ?? []

  const hasChanges = changeList.length > 0

  return (
    <Card
      className={cn(
        'rounded-2xl border border-royal-plum/10 bg-warm-ivory text-royal-plum flex flex-col justify-between shadow-xs',
        className
      )}
    >
      <div>
        <CardHeader className="pb-3 border-b border-royal-plum/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-serif">Live Change Explainer</CardTitle>
              <Badge variant="outline" className="tabular-nums font-semibold px-2 py-0.5 text-xs">
                {changeList.length}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-royal-plum/60 mt-1">
            Deterministic Hare-Niemeyer math balances budget in integer paise.
          </p>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col gap-3">
          {!hasChanges ? (
            <div className="rounded-xl border border-royal-plum/10 bg-white/40 p-6 text-center">
              <h4 className="font-serif font-bold text-sm text-royal-plum mb-1">
                No recent changes
              </h4>
              <p className="text-xs text-royal-plum/60 leading-relaxed">
                All allocations balanced. Adjust sliders to see live rebalancing.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {changeList.map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-xl border border-royal-plum/10 bg-white/60 p-3.5 flex flex-col gap-2.5 shadow-2xs"
                >
                  {/* Item Header & Undo */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-royal-plum leading-snug">
                      {item.description}
                    </p>
                    {onUndo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onUndo(item, index)}
                        className="h-7 shrink-0 gap-1 px-2.5 text-xs font-semibold"
                      >
                        <RotateCcw className="w-3 h-3 text-royal-plum" />
                        <span>Undo</span>
                      </Button>
                    )}
                  </div>

                  {/* Protected Moment Indicator */}
                  {item.isFloorProtected && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-gulabi-rose/20 px-2.5 py-1.5 text-xs font-semibold text-royal-plum border border-gulabi-rose/40">
                      <ShieldCheck className="w-4 h-4 text-royal-plum shrink-0" />
                      <span>Protected Moment — Non-negotiable floor locked</span>
                    </div>
                  )}

                  {/* Deltas List */}
                  {item.deltas && item.deltas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.deltas.map((delta, dIdx) => {
                        const isPositive = delta.deltaPaise > 0
                        const isNegative = delta.deltaPaise < 0
                        const formatted = formatINR(Math.abs(delta.deltaPaise))
                        const text = isPositive
                          ? `+${formatted} to ${delta.category}`
                          : isNegative
                          ? `-${formatted} from ${delta.category}`
                          : `${formatted} ${delta.category}`

                        return (
                          <span
                            key={dIdx}
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border tabular-nums',
                              isPositive && 'bg-marigold/20 text-[#2E5A44] border-marigold/40',
                              isNegative && 'bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]/25',
                              !isPositive && !isNegative && 'bg-royal-plum/5 text-royal-plum/70 border-royal-plum/10'
                            )}
                          >
                            {text}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Invariant guarantee footer */}
      {plan && (
        <div className="p-4 border-t border-royal-plum/8 bg-royal-plum/2 rounded-b-2xl flex items-center gap-2 text-2xs text-royal-plum/60">
          <Info className="w-3.5 h-3.5 text-royal-plum/40 shrink-0" />
          <span>
            Sum of allocations exactly equals{' '}
            <span className="tabular-nums font-semibold">{formatINR(plan.totalBudgetPaise)}</span>. Zero paise leakage.
          </span>
        </div>
      )}
    </Card>
  )
}
