'use client'

import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 200
/** The counter turns to a warning once the sentence is nearly full. */
const WARN_AT = 190

interface ProtectedMomentFieldProps {
  value: string
  onChange: (moment: string) => void
}

/** Single-sentence protected moment input (D-04, MOMENT-01) with a live character count. */
export function ProtectedMomentField({ value, onChange }: ProtectedMomentFieldProps) {
  const charCount = value.length

  return (
    <div className="flex flex-col gap-2 self-start rounded-2xl border border-royal-plum/10 bg-white/70 p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <label
          htmlFor="protected-moment-input"
          className="flex items-center gap-1.5 text-xs font-semibold text-royal-plum"
        >
          <ShieldCheck className="w-4 h-4 text-gulabi-rose" aria-hidden="true" />
          <span>Single-Sentence Protected Moment (Immune from Trimming)</span>
        </label>
        <span
          className={cn(
            'text-xs font-mono tabular-nums',
            charCount >= WARN_AT ? 'text-amber-800 font-bold' : 'text-royal-plum/70'
          )}
        >
          ({charCount}/{MAX_LENGTH})
        </span>
      </div>

      <textarea
        id="protected-moment-input"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        maxLength={MAX_LENGTH}
        rows={5}
        placeholder="e.g. Live soulful qawwali night under fairy lights"
        className="w-full resize-none rounded-xl border border-royal-plum/15 bg-warm-ivory/60 p-3 text-sm text-royal-plum placeholder:text-royal-plum/70 focus:border-royal-plum/50 focus:outline-hidden focus:ring-1 focus:ring-royal-plum/20"
      />

      <p className="text-xs text-royal-plum/70">
        This vision statement locks a 1.25x floor multiplier on its matching budget line so it will
        never be trimmed.
      </p>
    </div>
  )
}
