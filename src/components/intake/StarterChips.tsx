'use client'

import React from 'react'
import type { EventBrief } from '@/lib/engine/types'
import { Sparkles } from 'lucide-react'

export interface StarterChipOption {
  label: string
  brief: EventBrief
}

export const STARTER_OPTIONS: StarterChipOption[] = [
  {
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

interface StarterChipsProps {
  onSelect: (brief: EventBrief) => void
  disabled?: boolean
}

export function StarterChips({ onSelect, disabled }: StarterChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-royal-plum/70">
        <Sparkles className="w-3.5 h-3.5 text-marigold" />
        <span>1-Click Celebration Starters</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STARTER_OPTIONS.map((starter) => (
          <button
            key={starter.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(starter.brief)}
            className="rounded-full border border-royal-plum/15 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-royal-plum shadow-sm transition hover:border-marigold hover:bg-marigold/15 active:scale-95 disabled:opacity-50"
          >
            {starter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
