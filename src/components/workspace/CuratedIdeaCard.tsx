'use client'

import React from 'react'
import type { CuratedIdea, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export interface CuratedIdeaCardProps {
  idea: CuratedIdea
  plan: Plan
  isAdopted: boolean
  isReadOnly?: boolean
  onToggle: (idea: CuratedIdea, adopted: boolean) => void
}

/** One idea as a list row: what it is, what it costs, and the switch to adopt it. */
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
    const floor = Math.round((l.baselinePaise * 0.4) / 100) * 100
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
    <li
      id={`idea-${idea.id}`}
      className={cn(
        'flex items-start justify-between gap-4 px-4 py-4 sm:px-5',
        isAdopted
          ? 'relative bg-marigold/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-marigold'
          : ''
      )}
    >
      <div className="min-w-0">
        <h4 className="font-serif text-lg font-bold text-royal-plum">
          {idea.title}
          {idea.devanagariTitle && (
            <span className="ml-2 font-devanagari text-sm font-normal text-royal-plum/60">
              {idea.devanagariTitle}
            </span>
          )}
        </h4>
        <p className="mt-0.5 text-sm text-royal-plum/80">{idea.tagline}</p>
        <p className="mt-1 text-sm capitalize text-royal-plum/60">
          <span>{idea.category}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-medium tabular-nums normal-case text-royal-plum">
            {formatINR(idea.costPaise)}
          </span>
          <span aria-hidden="true"> · </span>
          <span className="normal-case">{idea.leadDays}d lead</span>
          {isAdopted && (
            <>
              <span aria-hidden="true"> · </span>
              <span className="font-medium normal-case text-royal-plum">Adopted</span>
            </>
          )}
        </p>

        {willExceedCapacity && (
          <p data-testid="shortfall-warning" className="mt-2 text-sm font-medium text-terracotta">
            Adopting will exceed flexible capacity &amp; activate Shortfall Banner remedies
          </p>
        )}

        <p className="mt-2 font-serif text-sm italic leading-relaxed text-royal-plum/70">
          &ldquo;{idea.culturalNuance}&rdquo;
        </p>
      </div>

      <Switch
        checked={isAdopted}
        disabled={isReadOnly}
        onCheckedChange={handleToggle}
        aria-label={`Toggle ${idea.title}`}
        className="mt-1 shrink-0"
      />
    </li>
  )
}
