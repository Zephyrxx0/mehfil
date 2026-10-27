'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { BudgetCategory, BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Lock, Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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
  const shouldReduceMotion = useReducedMotion()

  const rawPercentage = totalBudgetPaise > 0
    ? (line.currentPaise / totalBudgetPaise) * 100
    : 0

  const percentageStr = rawPercentage.toFixed(1)
  const percentageClamped = Math.min(100, Math.max(0, rawPercentage))
  const delta = line.currentPaise - line.baselinePaise

  return (
    <Card
      id={`category-${line.category}`}
      className={cn(
        'relative transition-all duration-200',
        line.isProtected
          ? 'border-gulabi-rose bg-gulabi-rose/15 shadow-sm ring-1 ring-gulabi-rose/50'
          : 'border-royal-plum/10 bg-warm-ivory hover:border-royal-plum/25 hover:shadow-xs'
      )}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
        {/* Card Header & Main Numbers */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm text-royal-plum truncate">{line.name}</h4>

              {line.isProtected ? (
                <Badge
                  variant="protected"
                  className="gap-1 bg-gulabi-rose text-royal-plum border-gulabi-rose shadow-2xs"
                >
                  <Lock className="w-2.5 h-2.5 fill-royal-plum text-royal-plum" />
                  <span>Protected Moment</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-2xs font-medium text-royal-plum/60 border-royal-plum/15"
                >
                  {LINE_TYPE_LABELS[line.lineType] || line.lineType}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-royal-plum/60">
              <span className="tabular-nums font-medium">{percentageStr}% of total budget</span>
              {line.lineType === 'flexible' && (
                <span className="text-2xs text-royal-plum/40">• 40% floor protected</span>
              )}
            </div>
          </div>

          {/* Amount & Delta Pill */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-serif font-bold text-base text-royal-plum tabular-nums">
              {formatINR(line.currentPaise)}
            </span>

            {delta !== 0 && (
              <Badge
                variant="outline"
                className={cn(
                  'font-bold text-2xs tabular-nums',
                  delta > 0
                    ? 'bg-marigold/30 text-royal-plum border-marigold/60'
                    : 'bg-amber-100/70 text-amber-900 border-amber-300'
                )}
              >
                {delta > 0 ? `+${formatINR(delta)}` : `-${formatINR(Math.abs(delta))}`}
              </Badge>
            )}
          </div>
        </div>

        {/* 1.2s Motion Spring Animated Allocation Bar (D-12, 04-UI-SPEC.md) */}
        <div className="relative w-full h-2 rounded-full bg-royal-plum/10 overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full transition-colors',
              line.isProtected ? 'bg-gulabi-rose' : 'bg-marigold'
            )}
            initial={false}
            animate={{ width: `${percentageClamped}%` }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', damping: 20, stiffness: 90, duration: 1.2 }
            }
          />
        </div>

        {/* Protected Moment User Quote Display with Tooltip (D-07, MOMENT-01) */}
        {line.isProtected && line.protectedQuote && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/60 px-2 py-1 text-2xs text-royal-plum/80 italic cursor-help border border-gulabi-rose/30">
                  <Quote className="w-3 h-3 text-gulabi-rose shrink-0 not-italic" />
                  <span className="truncate">&ldquo;{line.protectedQuote}&rdquo;</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p className="font-serif italic font-medium">&ldquo;{line.protectedQuote}&rdquo;</p>
                <p className="text-3xs text-royal-plum/60 mt-1 not-italic font-sans">
                  Immune from trimming &bull; 1.25x floor multiplier locked
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Action Footer: Category & Lock toggle */}
        <div className="flex items-center justify-between border-t border-royal-plum/8 pt-2.5">
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
            className={cn(
              'h-7 gap-1 px-2.5 text-2xs font-semibold',
              line.isProtected ? 'bg-gulabi-rose/40 text-royal-plum hover:bg-gulabi-rose/50' : ''
            )}
          >
            {line.isProtected ? (
              <>
                <Lock className="w-2.5 h-2.5 fill-royal-plum" />
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
