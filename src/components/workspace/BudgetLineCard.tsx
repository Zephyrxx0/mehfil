'use client'

import React from 'react'
import type { BudgetCategory, BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Star, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BudgetLineCardProps {
  line: BudgetLine
  totalBudgetPaise: number
  onSetProtected: (category: BudgetCategory) => void
}

const LINE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_guest: 'Per Guest',
  flexible: 'Flexible (Donor)',
  buffer: 'Buffer',
}

export function BudgetLineCard({
  line,
  totalBudgetPaise,
  onSetProtected,
}: BudgetLineCardProps) {
  const percentage = totalBudgetPaise > 0
    ? ((line.currentPaise / totalBudgetPaise) * 100).toFixed(1)
    : '0'

  const delta = line.currentPaise - line.baselinePaise

  return (
    <Card
      id={`category-${line.category}`}
      className={`relative transition-all duration-200 ${
        line.isProtected
          ? 'border-gulabi-rose bg-gulabi-rose/15 shadow-sm ring-1 ring-gulabi-rose/50'
          : 'border-royal-plum/10 bg-warm-ivory hover:border-royal-plum/25 hover:shadow-xs'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-royal-plum">{line.name}</h4>

              {line.isProtected ? (
                <Badge variant="protected" className="gap-1">
                  <Star className="w-3 h-3 fill-royal-plum text-royal-plum" />
                  <span>Protected Moment</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-2xs font-medium text-royal-plum/60 border-royal-plum/15">
                  {LINE_TYPE_LABELS[line.lineType] || line.lineType}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-royal-plum/60">
              <span>{percentage}% of total budget</span>
              {line.lineType === 'flexible' && (
                <span className="text-2xs text-royal-plum/40">• 40% floor protected</span>
              )}
            </div>
          </div>

          {/* Amount & Change Pill */}
          <div className="flex flex-col items-end gap-1">
            <span className="font-serif font-bold text-base text-royal-plum">
              {formatINR(line.currentPaise)}
            </span>

            {delta !== 0 && (
              <Badge
                variant="outline"
                className={`font-bold text-2xs ${
                  delta > 0
                    ? 'bg-emerald-100/70 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100/70 text-amber-900 border-amber-300'
                }`}
              >
                {delta > 0 ? `+${formatINR(delta)}` : `-${formatINR(Math.abs(delta))}`}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Footer: Star toggle */}
        <div className="mt-3 flex items-center justify-between border-t border-royal-plum/8 pt-2.5">
          <span className="text-2xs uppercase tracking-wider text-royal-plum/40 font-mono">
            {line.category}
          </span>

          <Button
            type="button"
            variant={line.isProtected ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onSetProtected(line.category)}
            title={
              line.isProtected
                ? 'Currently Protected Moment (ADR-0004)'
                : 'Make this category your Protected Moment'
            }
            className={`h-7 gap-1 px-2.5 text-2xs font-semibold ${
              line.isProtected ? 'bg-gulabi-rose/40 text-royal-plum' : ''
            }`}
          >
            {line.isProtected ? (
              <>
                <Lock className="w-2.5 h-2.5" />
                <span>Protected</span>
              </>
            ) : (
              <>
                <Star className="w-2.5 h-2.5" />
                <span>Set as Protected</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
