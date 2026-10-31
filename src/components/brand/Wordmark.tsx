import React from 'react'
import { cn } from '@/lib/utils'
import { TITLE_GLYPHS, TITLE_VIEWBOX } from '@/components/hero/title-paths'

export interface WordmarkProps {
  /** Overall size. `sm` for dense top bars, `md` default, `lg` for hero-adjacent spots. */
  size?: 'sm' | 'md' | 'lg'
  /** Kept for API compatibility; unused as the wordmark matches the landing page glyphs. */
  hideTag?: boolean
  className?: string
}

const SIZES = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
} as const

/**
 * The Mehfil brand wordmark, matching the landing page Ewert slab display face.
 * Renders the exact same vector glyph outlines as the hero title with full
 * accessibility labels.
 */
export function Wordmark({ size = 'md', className }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center text-royal-plum', className)}>
      <span className="sr-only">
        Mehfil (<span lang="hi">महफ़िल</span>)
      </span>
      <svg
        viewBox={TITLE_VIEWBOX}
        role="presentation"
        aria-hidden="true"
        className={cn('w-auto overflow-visible fill-current', SIZES[size])}
      >
        {TITLE_GLYPHS.map((glyph, i) => (
          <path key={i} d={glyph.d} />
        ))}
      </svg>
    </span>
  )
}
