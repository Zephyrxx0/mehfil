'use client'

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Amount added or removed by the +/- buttons. */
  step?: number
  id?: string
  className?: string
  'aria-label'?: string
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * Number field with themed -/+ buttons in place of the browser's spinner.
 * Typing is free-form; the value is clamped to [min, max] when the field loses
 * focus. The buttons clamp straight away and disable at the limits.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  id,
  className,
  'aria-label': ariaLabel,
}: NumberStepperProps) {
  // While the field is focused it shows what the user typed, which may be empty or out of range.
  const [draft, setDraft] = React.useState<string | null>(null)

  const commit = (n: number) => onChange(clamp(Math.round(n), min, max))

  const button =
    'flex h-full w-10 shrink-0 items-center justify-center text-royal-plum transition hover:bg-royal-plum/6 active:bg-royal-plum/10 focus-visible:outline-hidden focus-visible:bg-royal-plum/10 disabled:pointer-events-none disabled:opacity-30'

  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-xl border border-royal-plum/15 bg-white/80 transition',
        'focus-within:border-royal-plum focus-within:ring-1 focus-within:ring-royal-plum',
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => commit(value - step)}
        className={cn(button, 'border-r border-royal-plum/10')}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={draft ?? String(value)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          setDraft(digits)
          if (digits !== '') onChange(clamp(parseInt(digits, 10), min, max))
        }}
        onBlur={() => {
          setDraft(null)
          if (draft === '') onChange(min)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            commit(value + step)
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            commit(value - step)
          }
        }}
        className="w-20 min-w-0 bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-royal-plum focus:outline-hidden"
      />
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => commit(value + step)}
        className={cn(button, 'border-l border-royal-plum/10')}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
