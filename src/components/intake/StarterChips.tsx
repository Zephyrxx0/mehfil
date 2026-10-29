'use client'

import React from 'react'
import type { EventBrief } from '@/lib/engine/types'
import { rollForwardToFuture } from '@/lib/dates'

export type StarterKey = 'wedding' | 'birthday' | 'community'

export interface StarterChipOption {
  key: StarterKey
  label: string
  brief: EventBrief
}

export const STARTER_OPTIONS: StarterChipOption[] = [
  {
    key: 'wedding',
    label: 'Big Fat Delhi Wedding ₹25L',
    brief: {
      title: 'Delhi Grand Wedding',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      city: 'Delhi',
      guestCount: 300,
      totalBudgetPaise: 250_000_000, // ₹25,00,000
      protectedCategory: 'catering',
      nuances: ['Pure Veg / Jain Catering', 'Late Night Sound Permit'],
    },
  },
  {
    key: 'birthday',
    label: 'Intimate 50th Birthday ₹5L',
    brief: {
      title: '50th Milestone Birthday',
      eventType: 'birthday',
      eventDate: '2026-06-15',
      city: 'Mumbai',
      guestCount: 80,
      totalBudgetPaise: 50_000_000, // ₹5,00,000
      protectedCategory: 'photo_film',
      nuances: ['Elderly Accessibility & Ramps'],
    },
  },
  {
    key: 'community',
    label: 'Society Diwali Gala ₹8L',
    brief: {
      title: 'Society Diwali Gala',
      eventType: 'community',
      eventDate: '2026-10-30',
      city: 'Bengaluru',
      guestCount: 200,
      totalBudgetPaise: 80_000_000, // ₹8,00,000
      protectedCategory: 'entertainment',
      nuances: ['Morning Pooja / Ritual Slots', 'Late Night Sound Permit'],
    },
  },
]

/**
 * Starters carry fixed dates that go stale. Opening one never produces a plan
 * for a day that has passed: the date moves forward a year at a time.
 */
export function resolveStarterBrief(brief: EventBrief): EventBrief {
  return { ...brief, eventDate: rollForwardToFuture(brief.eventDate) }
}

interface StarterChipsProps {
  onSelect: (brief: EventBrief) => void
  disabled?: boolean
}

export function StarterChips({ onSelect, disabled }: StarterChipsProps) {
  return (
    <section
      aria-labelledby="starters-heading"
      className="self-start rounded-2xl border border-royal-plum/10 bg-muted/70 p-5"
    >
      <h3 id="starters-heading" className="text-sm font-semibold text-royal-plum">
        1-Click Celebration Starters
      </h3>
      <p className="mt-0.5 text-sm text-royal-plum/60">Skip the steps and open a ready-made plan.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {STARTER_OPTIONS.map((starter) => (
          <li key={starter.label}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(starter.brief)}
              className="flex w-full flex-col gap-0.5 rounded-xl border border-royal-plum/10 bg-warm-ivory px-4 py-3 text-left transition hover:border-royal-plum/30 hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum disabled:opacity-50"
            >
              <span className="text-sm font-semibold text-royal-plum">{starter.label}</span>
              <span className="text-xs tabular-nums text-royal-plum/60">
                {starter.brief.guestCount} guests · {starter.brief.city}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
