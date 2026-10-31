'use client'

import React from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface V2ChangeBannerProps {
  rationale: string
  vibeStatement?: string
  onDismiss: () => void
  onViewStyleDNA?: () => void
}

export function V2ChangeBanner({
  rationale,
  vibeStatement,
  onDismiss,
  onViewStyleDNA,
}: V2ChangeBannerProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className="flex items-start justify-between gap-4 border-l-2 border-marigold bg-marigold/10 px-4 py-3"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-royal-plum">Style DNA Infused (v2)</h2>
        <p className="mt-1 text-sm leading-relaxed text-royal-plum/80">
          {vibeStatement && (
            <span className="font-serif italic text-royal-plum">
              &ldquo;{vibeStatement}&rdquo; ·{' '}
            </span>
          )}
          {rationale}
        </p>
        {onViewStyleDNA && (
          <button
            type="button"
            onClick={onViewStyleDNA}
            className="mt-2 text-sm font-medium text-royal-plum underline underline-offset-4"
          >
            View Style DNA
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Dismiss v2 banner"
        className="h-8 w-8 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.aside>
  )
}
