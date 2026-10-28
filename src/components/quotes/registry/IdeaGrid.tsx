'use client'

import React from 'react'
import type { CuratedIdea, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { CURATED_IDEAS } from '@/data/curatedIdeas'
import { usePlanContext } from './PlanContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, CheckCircle2, Plus, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IdeaGridProps {
  ideaIds?: string[]
  highlightEntityId?: string
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
  plan?: Plan
  className?: string
}

export function IdeaGrid({
  ideaIds,
  highlightEntityId,
  onAdoptIdea,
  onRetractIdea,
  plan: propPlan,
  className,
}: IdeaGridProps) {
  const context = usePlanContext()
  const plan = propPlan || context.plan

  const handleAdoptIdea = onAdoptIdea || context.onAdoptIdea
  const handleRetractIdea = onRetractIdea || context.onRetractIdea

  // Resolve ideas from CURATED_IDEAS catalog
  const resolvedIdeas: CuratedIdea[] = (ideaIds && ideaIds.length > 0)
    ? ideaIds
        .map((id) => CURATED_IDEAS.find((i) => i.id === id))
        .filter((i): i is CuratedIdea => i !== undefined)
    : CURATED_IDEAS.slice(0, 4)

  const adoptedRecordIds = new Set(
    (plan?.adoptedIdeas || []).map((rec) => rec.ideaId)
  )

  if (resolvedIdeas.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-soft-ivory border border-royal-plum/10 text-center text-sm text-royal-plum/70">
        No matching celebration ideas found.
      </div>
    )
  }

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}
      data-testid="idea-grid"
    >
      {resolvedIdeas.map((idea) => {
        const isAdopted = adoptedRecordIds.has(idea.id)
        const isHighlighted = highlightEntityId === idea.id

        return (
          <div
            key={idea.id}
            className={cn(
              'p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4',
              isAdopted
                ? 'bg-marigold/10 border-marigold/60 shadow-sm ring-1 ring-marigold/40'
                : 'bg-warm-ivory border-royal-plum/10 hover:border-royal-plum/25 hover:shadow-sm',
              isHighlighted && 'ring-2 ring-marigold'
            )}
          >
            {/* Top: Category Tag, Devanagari Title, Main Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="bg-soft-ivory border-royal-plum/15 text-royal-plum text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5"
                >
                  {idea.category}
                </Badge>

                {idea.devanagariTitle && (
                  <span className="text-xs text-royal-plum/70 font-serif">
                    {idea.devanagariTitle}
                  </span>
                )}
              </div>

              <h4 className="font-serif text-lg font-semibold text-royal-plum leading-snug">
                {idea.title}
              </h4>

              <p className="text-xs text-royal-plum/80 leading-relaxed">
                {idea.culturalNuance || idea.description}
              </p>
            </div>

            {/* Middle: Cost & Donor Tag */}
            <div className="pt-3 border-t border-royal-plum/10 flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-royal-plum/60 font-medium">
                  Estimated Investment
                </span>
                <span className="text-base font-bold text-royal-plum tabular-nums">
                  {formatINR(idea.costPaise)}
                </span>
              </div>

              <div className="text-[11px] text-royal-plum/60 bg-soft-ivory/80 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span>Displacement</span>
                <span className="font-medium text-royal-plum/80">
                  Funds from: Misc & Decor
                </span>
              </div>
            </div>

            {/* Bottom: Interactive Action Button */}
            <div className="pt-1">
              {isAdopted ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetractIdea?.(idea.id)}
                  className="w-full rounded-full border-royal-plum/25 text-royal-plum hover:bg-royal-plum/5 text-xs font-semibold h-9 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>Adopted • Retract Idea</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleAdoptIdea?.(idea)}
                  className="w-full rounded-full bg-marigold hover:bg-marigold/90 text-royal-plum font-semibold text-xs h-9 shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-royal-plum" />
                  <span>Adopt Idea (+{formatINR(idea.costPaise)})</span>
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

