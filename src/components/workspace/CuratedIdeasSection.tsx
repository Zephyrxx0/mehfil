'use client'

import React, { useState, useMemo } from 'react'
import type { BudgetCategory, CuratedIdea, Plan } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { getPersonalizedIdeas } from '@/data/curatedIdeas'
import { CuratedIdeaCard } from './CuratedIdeaCard'
import { Sparkles, Coins, Layers, Search, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex flex-col gap-6" data-testid="curated-ideas-section">
      {/* Top Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Adopted Count Card */}
        <div className="rounded-2xl border border-royal-plum/10 bg-white/70 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
            <Sparkles className="w-4 h-4 text-marigold" />
            <span>Adopted Ideas</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-royal-plum">
              {adoptedCount}
            </span>
            <span className="text-xs text-royal-plum/50">enhancements active</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-2xs text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>Curated for {plan.brief.eventType}</span>
          </div>
        </div>

        {/* Invested Funds Card */}
        <div className="rounded-2xl border border-royal-plum/10 bg-white/70 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
            <Coins className="w-4 h-4 text-royal-plum/70" />
            <span>Invested in Enhancements</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-royal-plum">
              {formatINR(totalInvestedPaise)}
            </span>
          </div>
          <div className="mt-1 text-2xs text-royal-plum/60">
            Displaced from flexible lines
          </div>
        </div>

        {/* Remaining Flexible Capacity Card */}
        <div className="rounded-2xl border border-royal-plum/10 bg-white/70 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/60">
            <Layers className="w-4 h-4 text-gulabi-rose" />
            <span>Flexible Capacity</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-royal-plum">
              {formatINR(remainingFlexiblePaise)}
            </span>
            <span className="text-xs text-royal-plum/50">available</span>
          </div>
          <div className="mt-1 text-2xs text-royal-plum/60">
            Before reaching 40% floors
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0',
                selectedCategory === cat.value
                  ? 'bg-royal-plum text-warm-ivory shadow-2xs font-semibold'
                  : 'bg-white/80 text-royal-plum/70 border border-royal-plum/15 hover:bg-royal-plum/5'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-royal-plum/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas, rituals, tags..."
            className="w-full pl-8 pr-3 py-1.5 rounded-full border border-royal-plum/15 bg-white/80 text-xs text-royal-plum placeholder:text-royal-plum/40 focus:outline-hidden focus:ring-1 focus:ring-royal-plum"
          />
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-royal-plum">
            Curated Celebration Enhancements
          </h3>
          <span className="text-xs text-royal-plum/60">
            {filteredIdeas.length} idea{filteredIdeas.length === 1 ? '' : 's'} available
          </span>
        </div>

        {filteredIdeas.length === 0 ? (
          <div className="rounded-2xl border border-royal-plum/10 bg-white/50 p-8 text-center text-royal-plum/60 text-sm">
            No celebration ideas found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )}
      </div>
    </div>
  )
}
