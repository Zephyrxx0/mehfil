'use client'

import React, { useState, useMemo } from 'react'
import type { BudgetCategory, CuratedIdea, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { getPersonalizedIdeas } from '@/data/curatedIdeas'
import { CuratedIdeaCard } from './CuratedIdeaCard'
import { cn } from '@/lib/utils'

export interface CuratedIdeasSectionProps {
  plan: Plan
  isReadOnly?: boolean
  onAdoptIdea: (idea: CuratedIdea) => void
  onRetractIdea: (ideaId: string) => void
}

const CATEGORIES: Array<{ label: string; value: BudgetCategory | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Catering', value: 'catering' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Decor', value: 'decor' },
  { label: 'Favors', value: 'favors' },
  { label: 'Photography', value: 'photo_film' },
]

export function CuratedIdeasSection({
  plan,
  isReadOnly = false,
  onAdoptIdea,
  onRetractIdea,
}: CuratedIdeasSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Deterministically personalized ideas based on Event Brief & Style DNA (IDEA-01)
  const personalizedIdeas = useMemo(() => {
    return getPersonalizedIdeas(plan.brief, plan.styleDNA)
  }, [plan.brief, plan.styleDNA])

  // Summary Metrics
  const adoptedRecords = plan.adoptedIdeas ?? []
  const adoptedCount = adoptedRecords.length
  const totalInvestedPaise = adoptedRecords.reduce((sum, r) => sum + r.costPaise, 0)

  const remainingFlexiblePaise = useMemo(() => {
    return plan.lines
      .filter((l) => l.lineType === 'flexible' && !l.isProtected)
      .reduce((sum, line) => {
        const floor = Math.round((line.baselinePaise * 0.40) / 100) * 100
        return sum + Math.max(0, line.currentPaise - floor)
      }, 0)
  }, [plan.lines])

  // Filter ideas by category and search term
  const filteredIdeas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return personalizedIdeas.filter((idea) => {
      const matchesCategory =
        selectedCategory === 'all' || idea.category === selectedCategory

      if (!matchesCategory) return false

      if (!query) return true

      const inTitle = idea.title.toLowerCase().includes(query)
      const inTagline = idea.tagline.toLowerCase().includes(query)
      const inNuance = idea.culturalNuance.toLowerCase().includes(query)
      const inTags = idea.styleTags.some((tag) => tag.toLowerCase().includes(query))
      const inDevanagari = idea.devanagariTitle ? idea.devanagariTitle.includes(query) : false

      return inTitle || inTagline || inNuance || inTags || inDevanagari
    })
  }, [personalizedIdeas, selectedCategory, searchQuery])

  const adoptedIdeaIds = useMemo(() => {
    return new Set(adoptedRecords.map((r) => r.ideaId))
  }, [adoptedRecords])

  const handleToggle = (idea: CuratedIdea, adopted: boolean) => {
    if (adopted) {
      onAdoptIdea(idea)
    } else {
      onRetractIdea(idea.id)
    }
  }

  return (
    <div className="flex flex-col gap-8" data-testid="curated-ideas-section">
      {/* One summary strip instead of three cards */}
      <dl className="grid grid-cols-1 divide-y divide-royal-plum/10 border-y border-royal-plum/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-4 sm:pr-5">
          <dt className="text-sm text-royal-plum/60">Adopted ideas</dt>
          <dd className="mt-1 font-serif text-2xl font-bold tabular-nums text-royal-plum">{adoptedCount}</dd>
          <p className="mt-0.5 text-sm text-royal-plum/60">Curated for {plan.brief.eventType}</p>
        </div>
        <div className="py-4 sm:px-5">
          <dt className="text-sm text-royal-plum/60">Invested in enhancements</dt>
          <dd className="mt-1 font-serif text-2xl font-bold tabular-nums text-royal-plum">
            {formatINR(totalInvestedPaise)}
          </dd>
          <p className="mt-0.5 text-sm text-royal-plum/60">Displaced from flexible lines</p>
        </div>
        <div className="py-4 sm:pl-5">
          <dt className="text-sm text-royal-plum/60">Flexible capacity</dt>
          <dd className="mt-1 font-serif text-2xl font-bold tabular-nums text-royal-plum">
            {formatINR(remainingFlexiblePaise)}
          </dd>
          <p className="mt-0.5 text-sm text-royal-plum/60">Before reaching 40% floors</p>
        </div>
      </dl>

      <section aria-labelledby="ideas-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 id="ideas-heading" className="flex items-center gap-2.5 font-serif text-xl font-bold text-royal-plum">
            <span aria-hidden="true" className="h-4 w-1 shrink-0 origin-bottom rounded-full bg-gradient-to-b from-marigold to-gulabi-rose motion-safe:animate-[mehfil-flourish_0.5s_cubic-bezier(0.22,1,0.36,1)_both]" />
            <span>Curated Celebration Enhancements</span>
          </h3>
          <span className="text-sm text-royal-plum/60">
            {filteredIdeas.length} idea{filteredIdeas.length === 1 ? '' : 's'} available
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter by category" className="-mx-1 flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                aria-pressed={selectedCategory === cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors',
                  selectedCategory === cat.value
                    ? 'bg-royal-plum font-medium text-warm-ivory'
                    : 'text-royal-plum/70 hover:bg-royal-plum/5 hover:text-royal-plum'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas, rituals, tags..."
            aria-label="Search ideas"
            className="w-full rounded-xl border border-royal-plum/15 bg-white/70 px-3.5 py-2 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum sm:w-64"
          />
        </div>

        {filteredIdeas.length === 0 ? (
          <p className="border-y border-royal-plum/10 py-10 text-center text-sm text-royal-plum/60">
            No celebration ideas found matching your criteria.
          </p>
        ) : (
          <ul className="divide-y divide-royal-plum/10 border-y border-royal-plum/10">
            {filteredIdeas.map((idea) => (
              <CuratedIdeaCard
                key={idea.id}
                idea={idea}
                plan={plan}
                isAdopted={adoptedIdeaIds.has(idea.id)}
                isReadOnly={isReadOnly}
                onToggle={handleToggle}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
