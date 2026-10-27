'use client'

import React from 'react'
import type { EventType } from '@/lib/engine/types'

interface StepEventBasicsProps {
  title: string
  eventType: EventType
  eventDate: string
  city: string
  onChange: (fields: {
    title?: string
    eventType?: EventType
    eventDate?: string
    city?: string
  }) => void
}

const EVENT_TYPES: { type: EventType; label: string; desc: string }[] = [
  { type: 'wedding', label: 'Wedding', desc: 'Multi-day celebration with full rituals' },
  { type: 'birthday', label: 'Milestone Birthday', desc: '50th, 60th, or milestone gathering' },
  { type: 'community', label: 'Cultural Soiree', desc: 'Diwali gala, society meet, or musical mehfil' },
]

export function StepEventBasics({
  title,
  eventType,
  eventDate,
  city,
  onChange,
}: StepEventBasicsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2">
          Celebration Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {EVENT_TYPES.map((t) => {
            const isSelected = eventType === t.type
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => onChange({ eventType: t.type })}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'border-royal-plum bg-warm-ivory shadow-sm ring-1 ring-royal-plum'
                    : 'border-royal-plum/10 bg-white/60 hover:border-royal-plum/30'
                }`}
              >
                <span className="text-sm font-semibold text-royal-plum">{t.label}</span>
                <span className="text-xs text-royal-plum/60 mt-0.5">{t.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-1.5">
            Celebration Name
          </label>
          <input
            type="text"
            placeholder="e.g. Aditi & Kabir's Wedding"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 py-2 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-1.5">
            Destination City
          </label>
          <input
            type="text"
            placeholder="e.g. Delhi, Jaipur, Mumbai"
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 py-2 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-1.5">
          Celebration Date
        </label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => onChange({ eventDate: e.target.value })}
          className="w-full sm:w-1/2 rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 py-2 text-sm text-royal-plum focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
        />
        <p className="mt-1 text-xs text-royal-plum/60">
          Mehfil will build your backwards milestone calendar from this date.
        </p>
      </div>
    </div>
  )
}

