'use client'

import React from 'react'
import type { EventType } from '@/lib/engine/types'
import { DatePicker } from '@/components/ui/date-picker'
import { isPastDate } from '@/lib/dates'

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
  {
    type: 'community',
    label: 'Cultural Soiree',
    desc: 'Diwali gala, society meet, or musical mehfil',
  },
]

export function StepEventBasics({
  title,
  eventType,
  eventDate,
  city,
  onChange,
}: StepEventBasicsProps) {
  const datePassed = isPastDate(eventDate)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span
          id="celebration-type-label"
          className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2"
        >
          Celebration Type
        </span>
        <div
          role="group"
          aria-labelledby="celebration-type-label"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        >
          {EVENT_TYPES.map((t) => {
            const isSelected = eventType === t.type
            return (
              <button
                key={t.type}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ eventType: t.type })}
                className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                  isSelected
                    ? 'border-royal-plum bg-warm-ivory shadow-sm ring-1 ring-royal-plum'
                    : 'border-royal-plum/10 bg-white/60 hover:border-royal-plum/30'
                }`}
              >
                <span className="text-sm font-semibold text-royal-plum">{t.label}</span>
                <span className="mt-1 text-xs leading-snug text-royal-plum/70">{t.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="celebration-name"
            className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2"
          >
            Celebration Name
          </label>
          <input
            id="celebration-name"
            type="text"
            placeholder="e.g. Aditi & Kabir's Wedding"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-11 w-full rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 text-sm text-royal-plum placeholder:text-royal-plum/70 transition hover:border-royal-plum/30 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
          />
        </div>

        <div>
          <label
            htmlFor="celebration-city"
            className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2"
          >
            Destination City
          </label>
          <input
            id="celebration-city"
            type="text"
            placeholder="e.g. Delhi, Jaipur, Mumbai"
            value={city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="h-11 w-full rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 text-sm text-royal-plum placeholder:text-royal-plum/70 transition hover:border-royal-plum/30 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
          />
        </div>
      </div>

      <div className="sm:max-w-[calc(50%-0.5rem)]">
        <label
          htmlFor="celebration-date"
          className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2"
        >
          Celebration Date
        </label>
        <DatePicker
          id="celebration-date"
          value={eventDate}
          onChange={(v) => onChange({ eventDate: v })}
        />
        {datePassed ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-terracotta">
            That date has already passed. Pick today or a later day.
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-royal-plum/70">
            Mehfil will build your backwards milestone calendar from this date.
          </p>
        )}
      </div>
    </div>
  )
}
