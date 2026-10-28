'use client'

import React from 'react'
import type { BudgetCategory, BudgetLine, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { usePlanContext } from './PlanContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  UtensilsCrossed,
  Building2,
  Sparkles,
  Camera,
  Music,
  Gift,
  Package,
  Shield,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VendorChecklistProps {
  lineIds?: string[]
  highlightEntityId?: string
  onSelectLine?: (lineId: string) => void
  onCheckQuote?: (category: BudgetCategory) => void
  plan?: Plan
  className?: string
}

const CATEGORY_META: Record<
  BudgetCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  venue: { label: 'Venue & Banquet', icon: Building2 },
  catering: { label: 'Festive Catering', icon: UtensilsCrossed },
  decor: { label: 'Floral & Stage Decor', icon: Sparkles },
  photo_film: { label: 'Photo & Cinematography', icon: Camera },
  entertainment: { label: 'Live Music & DJ', icon: Music },
  favors: { label: 'Gifts & Favors', icon: Gift },
  misc: { label: 'Logistics & Sundries', icon: Package },
  contingency: { label: 'Contingency Reserve', icon: Shield },
}

export function VendorChecklist({
  lineIds,
  highlightEntityId,
  onSelectLine,
  onCheckQuote,
  plan: propPlan,
  className,
}: VendorChecklistProps) {
  const context = usePlanContext()
  const plan = propPlan || context.plan

  const handleCheckQuote = onCheckQuote || context.onCheckQuote
  const handleSelectLine = onSelectLine || context.onSelectLine

  if (!plan || !plan.lines) {
    return (
      <div className="p-6 rounded-2xl bg-soft-ivory border border-royal-plum/10 text-center text-sm text-royal-plum/70">
        No active plan lines available for checklist resolution.
      </div>
    )
  }

  // Resolve lines: if lineIds is provided, pick those lines; otherwise show all lines
  const resolvedLines: BudgetLine[] = lineIds && lineIds.length > 0
    ? lineIds
        .map((id) => plan.lines.find((l) => l.id === id))
        .filter((l): l is BudgetLine => l !== undefined)
    : plan.lines

  return (
    <div className={cn('flex flex-col gap-3', className)} data-testid="vendor-checklist">
      {resolvedLines.map((line) => {
        const meta = CATEGORY_META[line.category] || {
          label: line.name,
          icon: Package,
        }
        const Icon = meta.icon
        const isHighlighted = highlightEntityId === line.id
        const isCommitted = Boolean(line.isCommitted)

        return (
          <div
            key={line.id}
            onClick={() => handleSelectLine?.(line.id)}
            className={cn(
              'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
              isHighlighted
                ? 'bg-amber-50/60 border-marigold ring-2 ring-marigold/30 shadow-sm'
                : 'bg-warm-ivory border-royal-plum/10 hover:border-royal-plum/20',
              line.isProtected && 'border-l-4 border-l-[#F2A7B8]'
            )}
          >
            {/* Left: Category Icon & Details */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isCommitted
                    ? 'bg-marigold/20 text-royal-plum'
                    : 'bg-soft-ivory text-royal-plum/80 border border-royal-plum/10'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-royal-plum text-sm sm:text-base">
                    {line.name}
                  </span>
                  {line.isProtected && (
                    <Badge
                      variant="outline"
                      className="bg-[#F2A7B8]/20 text-[#3A2442] border-[#F2A7B8] text-[10px] px-1.5 py-0"
                    >
                      Protected Moment
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-royal-plum/60 flex items-center gap-2 mt-0.5">
                  <span>Baseline: {formatINR(line.baselinePaise)}</span>
                  <span>•</span>
                  <span className="font-medium text-royal-plum/80">
                    Allocated: {formatINR(line.currentPaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Commitment Status & Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isCommitted ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-marigold text-royal-plum border-marigold/40 font-semibold px-2.5 py-1 text-xs flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-royal-plum" />
                    <span>Committed: {line.committedVendor || 'Vendor'}</span>
                  </Badge>

                  {line.variancePaise !== undefined && line.variancePaise !== 0 && (
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full flex items-center gap-0.5',
                        line.variancePaise < 0
                          ? 'text-[#4A7C59] bg-[#4A7C59]/10'
                          : 'text-royal-plum/80 bg-royal-plum/5'
                      )}
                    >
                      {line.variancePaise < 0 ? (
                        <>
                          <TrendingDown className="w-3 h-3 text-[#4A7C59]" />
                          <span>Saved {formatINR(Math.abs(line.variancePaise))}</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3 h-3 text-royal-plum/70" />
                          <span>+{formatINR(line.variancePaise)} actual</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCheckQuote?.(line.category)
                  }}
                  className="rounded-full border-royal-plum/20 hover:border-marigold hover:bg-marigold/10 text-royal-plum text-xs font-semibold h-8 px-3 flex items-center gap-1"
                >
                  <span>Check Quote</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-royal-plum/70" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
