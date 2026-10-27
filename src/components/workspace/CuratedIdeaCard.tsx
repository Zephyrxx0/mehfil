'use client'

import React from 'react'
import type { CuratedIdea, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Clock, Sparkles, Quote, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CuratedIdeaCardProps {
  idea: CuratedIdea
  plan: Plan
  isAdopted: boolean
  isReadOnly?: boolean
  onToggle: (idea: CuratedIdea, adopted: boolean) => void
}

export function CuratedIdeaCard({
  idea,
  plan,
  isAdopted,
  isReadOnly = false,
  onToggle,
}: CuratedIdeaCardProps) {
  // Pre-adoption capacity calculation (IDEA-02, D-04)
  const flexibleDonorLines = plan.lines.filter(
    (l) => l.lineType === 'flexible' && !l.isProtected && l.category !== idea.category
  )

  const availableDonorCapacityPaise = flexibleDonorLines.reduce((acc, l) => {
    const floor = Math.round((l.baselinePaise * 0.40) / 100) * 100
    return acc + Math.max(0, l.currentPaise - floor)
  }, 0)

  const willExceedCapacity = !isAdopted && idea.costPaise > availableDonorCapacityPaise

  const handleToggle = (checked: boolean) => {
    if (isReadOnly) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50)
      } catch {
        // Safe fallback in unsupported or iframe contexts
      }
    }
    onToggle(idea, checked)
  }

  return (
    <Card
      id={`idea-${idea.id}`}
      className={cn(
        'relative transition-all duration-200 border bg-white/80 shadow-xs flex flex-col justify-between',
        isAdopted
          ? 'border-marigold/60 bg-marigold/5 ring-1 ring-marigold/40'
          : 'border-royal-plum/10 hover:border-royal-plum/25 hover:shadow-sm'
      )}
    >
      <CardContent className="p-4 flex flex-col gap-3 h-full justify-between">
        {/* Top Header: Title, Devanagari flourish & Switch */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-serif font-bold text-base text-royal-plum">
                {idea.title}
              </h4>
              {idea.devanagariTitle && (
                <span className="font-devanagari text-xs text-royal-plum/60 font-normal">
                  {idea.devanagariTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-royal-plum/70 line-clamp-2">
              {idea.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Switch
              checked={isAdopted}
              disabled={isReadOnly}
              onCheckedChange={handleToggle}
              aria-label={`Toggle ${idea.title}`}
            />
          </div>
        </div>

        {/* Badges: Category, Cost Pill, Lead Time, and Adopted Pill */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="capitalize text-2xs font-medium text-royal-plum/70 border-royal-plum/20 bg-warm-ivory"
          >
            {idea.category}
          </Badge>

          <Badge
            variant="outline"
            className="text-2xs font-bold text-royal-plum border-marigold/50 bg-marigold/15 tabular-nums"
          >
            {formatINR(idea.costPaise)}
          </Badge>

          <Badge
            variant="outline"
            className="text-2xs font-medium text-royal-plum/60 border-royal-plum/15 gap-1 bg-warm-ivory"
          >
            <Clock className="w-3 h-3 text-royal-plum/60" />
            <span>{idea.leadDays}d lead</span>
          </Badge>

          {isAdopted && (
            <Badge
              variant="outline"
              className="bg-marigold text-royal-plum border-marigold font-semibold text-2xs gap-1 shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-royal-plum" />
              <span>Adopted</span>
            </Badge>
          )}
        </div>

        {/* Pre-adoption Capacity Warning Pill (ADR-0002, ADR-0004) */}
        {willExceedCapacity && (
          <div
            className="rounded-lg border border-amber-300 bg-amber-50/90 px-2.5 py-1.5 text-xs text-amber-900 flex items-center gap-1.5 font-medium"
            data-testid="shortfall-warning"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Adopting will exceed flexible capacity & activate Shortfall Banner remedies</span>
          </div>
        )}

        {/* Cultural Nuance Callout Box */}
        <div className="rounded-xl border border-royal-plum/10 bg-warm-ivory/80 p-2.5 text-xs text-royal-plum/80 italic flex items-start gap-2">
          <Quote className="w-3.5 h-3.5 text-marigold shrink-0 mt-0.5 not-italic" />
          <p className="font-serif leading-relaxed">&ldquo;{idea.culturalNuance}&rdquo;</p>
        </div>
      </CardContent>
    </Card>
  )
}
