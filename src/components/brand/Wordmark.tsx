import React from 'react'
import { cn } from '@/lib/utils'

export interface WordmarkProps {
  /** Overall size. `sm` for dense top bars, `md` default, `lg` for hero-adjacent spots. */
  size?: 'sm' | 'md' | 'lg'
  /** Hide the small all-caps "Mehfil" tag that sits beside the mark. */
  hideTag?: boolean
  className?: string
}

const SIZES = {
  sm: { meh: 'text-lg', dev: 'text-xl', tag: 'text-[0.6rem]' },
  md: { meh: 'text-xl', dev: 'text-2xl', tag: 'text-xs' },
  lg: { meh: 'text-3xl', dev: 'text-4xl', tag: 'text-xs' },
} as const

/**
 * The Mehfil wordmark for inner pages. "Meh" is set in Fraunces (the display
 * serif) rather than the hero's Ewert slab, which is unreadable at header sizes;
 * "फ़िल" is bold Noto Serif Devanagari (proper Unicode, with the nukta). The
 * accessible name is the full Latin + Devanagari brand.
 */
export function Wordmark({ size = 'md', hideTag = false, className }: WordmarkProps) {
  const s = SIZES[size]
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className="sr-only">Mehfil (महफ़िल)</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        <span className={cn('font-serif font-bold leading-none tracking-tight text-royal-plum', s.meh)}>Meh</span>
        <span className={cn('font-devanagari font-bold leading-none text-maroon', s.dev)}>फ़िल</span>
      </span>
      {!hideTag && (
        <span
          aria-hidden="true"
          className={cn('font-medium uppercase tracking-widest text-royal-plum/45', s.tag)}
        >
          Mehfil
        </span>
      )}
    </span>
  )
}
