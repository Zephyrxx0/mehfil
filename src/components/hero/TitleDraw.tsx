'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TITLE_GLYPHS, TITLE_VIEWBOX } from './title-paths'

/**
 * "Mehfil" drawn as real Ewert glyph outlines (an all-caps slab display face).
 * Each outline is traced with a stroke, then filled. The accessible heading name
 * still carries the Latin and Devanagari spellings.
 */
export function TitleDraw({ className }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <h1 className={className} data-testid="hero-title">
      <span className="sr-only">
        Mehfil, <span lang="hi">महफ़िल</span>
      </span>
      <svg
        viewBox={TITLE_VIEWBOX}
        role="presentation"
        aria-hidden="true"
        className="block h-auto w-full overflow-visible"
      >
        {TITLE_GLYPHS.map((glyph, i) => {
          const colour =
            glyph.script === 'latin' ? 'hsl(var(--foreground))' : 'hsl(var(--maroon))'
          return (
            <motion.path
              key={i}
              d={glyph.d}
              pathLength={1}
              style={{ fill: colour, stroke: colour }}
              strokeWidth={7}
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{
                pathLength: { duration: 1.5, delay: 0.15 + i * 0.28, ease: [0.32, 0.72, 0, 1] },
                fillOpacity: { duration: 0.7, delay: 1.1 + i * 0.28, ease: 'easeOut' },
              }}
            />
          )
        })}
      </svg>
    </h1>
  )
}
