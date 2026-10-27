'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Sparkles, X, Palette, ArrowRight } from 'lucide-react'
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
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-marigold/40 bg-gradient-to-r from-marigold/20 via-warm-ivory to-gulabi-rose/15 p-4 shadow-xs"
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marigold text-royal-plum shadow-2xs mt-0.5">
          <Sparkles className="h-5 w-5 fill-royal-plum" />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-sm font-bold text-royal-plum">
              Style DNA Infused (v2)
            </h3>
            <span className="rounded-full bg-royal-plum/10 px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-royal-plum">
              Aesthetic Recalibration
            </span>
          </div>

          <p className="text-xs text-royal-plum/85 leading-relaxed">
            {vibeStatement && (
              <span className="font-serif italic text-royal-plum font-semibold">
                &ldquo;{vibeStatement}&rdquo; &bull;{' '}
              </span>
            )}
            {rationale}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {onViewStyleDNA && (
          <Button
            type="button"
            size="sm"
            onClick={onViewStyleDNA}
            className="h-8 gap-1.5 bg-royal-plum text-warm-ivory text-xs font-semibold shadow-xs hover:bg-royal-plum/90"
          >
            <Palette className="w-3.5 h-3.5 text-marigold" />
            <span>View Style DNA</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss v2 banner"
          className="h-8 w-8 p-0 text-royal-plum/60 hover:text-royal-plum hover:bg-royal-plum/5"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
