'use client'

import React from 'react'

interface StepNuancesProps {
  nuances: string[]
  customNotes: string
  onChange: (fields: { nuances?: string[]; customNotes?: string }) => void
}

const CULTURAL_NUANCE_TAGS = [
  'Pure Veg / Jain Catering',
  'Elderly Accessibility & Ramps',
  'Late Night Sound Permit',
  'Morning Pooja / Ritual Slots',
  'Eco-Friendly / Zero Floral Waste',
  'Kids Play Area & Creche',
]

export function StepNuances({
  nuances,
  customNotes,
  onChange,
}: StepNuancesProps) {
  const toggleNuance = (tag: string) => {
    const next = nuances.includes(tag)
      ? nuances.filter((t) => t !== tag)
      : [...nuances, tag]
    onChange({ nuances: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-2">
          Cultural & Operational Nuances (Optional)
        </label>
        <p className="text-xs text-royal-plum/60 mb-3">
          Select any special logistical considerations for your celebration.
        </p>
        <div className="flex flex-wrap gap-2">
          {CULTURAL_NUANCE_TAGS.map((tag) => {
            const isSelected = nuances.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleNuance(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                  isSelected
                    ? 'border-royal-plum bg-royal-plum text-warm-ivory shadow-sm'
                    : 'border-royal-plum/15 bg-white/70 text-royal-plum hover:border-royal-plum/30'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-royal-plum/70 mb-1.5">
          Custom Family Notes or Traditions
        </label>
        <textarea
          rows={3}
          placeholder="e.g. Grandma's special sweets counter, surprise fireworks, specific auspicious time (muhurat) for pheras..."
          value={customNotes}
          onChange={(e) => onChange({ customNotes: e.target.value })}
          className="w-full rounded-xl border border-royal-plum/15 bg-white/80 p-3 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
        />
      </div>
    </div>
  )
}
