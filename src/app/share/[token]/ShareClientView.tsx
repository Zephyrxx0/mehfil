'use client'

import * as React from 'react'
import type { SanitizedSharedPlan, BudgetCategory } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { generatePublicCeremoniesICS, downloadICS } from '@/lib/engine/ics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  Heart,
  CalendarPlus,
  Sparkles,
  MapPin,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

export interface ShareClientViewProps {
  sanitizedPlan: SanitizedSharedPlan | null
}

export function ShareClientView({ sanitizedPlan }: ShareClientViewProps) {
  // If plan not found or token has been invalidated/expired (D-08, 03-UI-SPEC.md §4)
  if (!sanitizedPlan || sanitizedPlan.isExpired) {
    return (
      <main className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-5 rounded-3xl border border-royal-plum/10 bg-white/60 p-8 sm:p-10 shadow-xl backdrop-blur-sm">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center">
            <Clock className="h-7 w-7 stroke-[1.75]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-royal-plum">
              Celebration Link Expired
            </h1>
            <p className="text-sm text-royal-plum/70 leading-relaxed">
              The celebration organizer has refreshed this link or concluded the planning phase. Please request an updated share link from the family host.
            </p>
          </div>

          <div className="pt-2">
            <Button asChild className="bg-royal-plum text-warm-ivory hover:bg-royal-plum/90">
              <Link href="/">Return to Mehfil Home</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // Calculate days remaining until celebration
  const daysRemaining = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const event = new Date(sanitizedPlan.eventDate)
    const diffTime = event.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [sanitizedPlan.eventDate])

  const formattedEventDate = React.useMemo(() => {
    try {
      const parts = sanitizedPlan.eventDate.split('-').map(Number)
      const date = new Date(parts[0], parts[1] - 1, parts[2])
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return sanitizedPlan.eventDate
    }
  }, [sanitizedPlan.eventDate])

  const handleExportICS = () => {
    const icsContent = generatePublicCeremoniesICS(sanitizedPlan)
    const filename = `${sanitizedPlan.title.toLowerCase().replace(/\s+/g, '-')}-ceremonies.ics`
    downloadICS(icsContent, filename)
  }

  return (
    <main className="min-h-screen bg-warm-ivory text-royal-plum py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        {/* Top Wordmark & Header */}
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-devanagari text-3xl font-bold tracking-tight text-royal-plum">
              महफ़िल
            </span>
            <span className="text-xs uppercase tracking-widest text-royal-plum/50 font-medium">
              • MEHFIL CELEBRATION
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-royal-plum max-w-2xl leading-tight">
            {sanitizedPlan.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium text-royal-plum/80 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-royal-plum/60" />
              <span>{formattedEventDate}</span>
            </span>
            <span className="text-royal-plum/30">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-royal-plum/60" />
              <span>{sanitizedPlan.city}</span>
            </span>
            <span className="text-royal-plum/30">•</span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-royal-plum/60" />
              <span>{sanitizedPlan.guestCount} Celebrated Guests</span>
            </span>
          </div>

          {/* Event Countdown Banner */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-marigold/40 bg-marigold/20 px-5 py-2 text-sm font-semibold text-royal-plum shadow-2xs">
              <Clock className="h-4 w-4 text-royal-plum/70" />
              <span>
                {daysRemaining > 0
                  ? `${daysRemaining} days until celebration`
                  : daysRemaining === 0
                  ? 'Celebration is today!'
                  : 'Celebration completed'}
              </span>
            </div>
          </div>
        </header>

        {/* Cherished Priority Card (Gulabi Rose Protected Moment) */}
        {sanitizedPlan.protectedMoment && (
          <section
            aria-labelledby="protected-moment-heading"
            className="rounded-3xl border border-gulabi-rose/40 bg-gulabi-rose/15 p-6 sm:p-8 flex flex-col gap-3 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gulabi-rose bg-gulabi-rose/30 px-3 py-0.5 text-2xs uppercase tracking-wider font-bold text-royal-plum">
                <Heart className="h-3 w-3 fill-royal-plum text-royal-plum" />
                Cherished Priority
              </span>
            </div>

            <h2
              id="protected-moment-heading"
              className="font-serif text-2xl font-bold text-royal-plum"
            >
              {sanitizedPlan.protectedMoment.name}
            </h2>

            <p className="text-sm text-royal-plum/80 leading-relaxed max-w-xl">
              The family has designated this ceremony as an uncompromising celebration priority, guaranteeing mathematical allocation protection throughout planning.
            </p>
          </section>
        )}

        {/* High-Level Category Proportions (No vendor quotes/margins) */}
        <section
          aria-labelledby="category-breakdown-heading"
          className="rounded-3xl border border-royal-plum/10 bg-white/70 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-royal-plum/8 pb-4">
            <div>
              <h2
                id="category-breakdown-heading"
                className="font-serif text-xl font-bold text-royal-plum"
              >
                Celebration Overview
              </h2>
              <p className="text-xs text-royal-plum/60 mt-0.5">
                Harmonized resource distribution across celebration experiences
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xs uppercase tracking-wider text-royal-plum/50 font-bold block">
                Total Budget
              </span>
              <span className="text-lg font-bold tabular-nums text-royal-plum">
                {formatINR(sanitizedPlan.totalBudgetPaise)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(sanitizedPlan.categoryTotals).map(([cat, paise]) => {
              const categoryKey = cat as BudgetCategory
              const pct = sanitizedPlan.categoryPercentages[categoryKey] || 0
              const label = cat.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

              return (
                <div
                  key={cat}
                  className="rounded-2xl border border-royal-plum/8 bg-warm-ivory/50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-royal-plum">{label}</span>
                    <span className="font-bold tabular-nums text-royal-plum">
                      {formatINR(paise)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-royal-plum/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-marigold"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-royal-plum/70 w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Ceremony Timeline & Guest Calendar Export */}
        <section
          aria-labelledby="ceremonies-timeline-heading"
          className="rounded-3xl border border-royal-plum/10 bg-white/70 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-royal-plum/8 pb-4">
            <div>
              <h2
                id="ceremonies-timeline-heading"
                className="font-serif text-xl font-bold text-royal-plum"
              >
                Ceremony Milestones
              </h2>
              <p className="text-xs text-royal-plum/60 mt-0.5">
                Public celebration schedule for honored guests and family
              </p>
            </div>

            <Button
              type="button"
              onClick={handleExportICS}
              className="bg-royal-plum text-warm-ivory hover:bg-royal-plum/90 gap-2 text-xs font-semibold self-start sm:self-center"
            >
              <CalendarPlus className="h-4 w-4 text-marigold" />
              <span>Add Ceremonies to Calendar (.ics)</span>
            </Button>
          </div>

          {sanitizedPlan.publicMilestones.length > 0 ? (
            <div className="space-y-4">
              {sanitizedPlan.publicMilestones.map((milestone, idx) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-royal-plum/8 bg-warm-ivory/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marigold/20 text-royal-plum font-serif font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-royal-plum">
                        {milestone.title}
                      </h3>
                      {milestone.isCeremony && (
                        <Badge variant="secondary" className="text-2xs">
                          Ceremony
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-royal-plum/60 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{milestone.targetDate}</span>
                      {milestone.leadDays > 0 && (
                        <span>• T-{milestone.leadDays} days</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-royal-plum/60 py-4 text-center">
              Ceremonies will be published as celebration details are finalized.
            </p>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-royal-plum/10 text-xs text-royal-plum/50 space-y-1">
          <p>Planned with precision & reassurance on Mehfil (महफ़िल)</p>
          <p>Words from models, numbers from code</p>
        </footer>
      </div>
    </main>
  )
}
