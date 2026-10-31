'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'

interface VibeSelectionStatusProps {
  count: number
  isReady: boolean
  /** Briefly true after a refused pick, to shake the badge. */
  shake: boolean
}

export function VibeSelectionStatus({ count, isReady, shake }: VibeSelectionStatusProps) {
  return (
    <motion.div
      animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium',
        isReady ? 'text-royal-plum' : 'text-royal-plum/70'
      )}
    >
      {isReady ? (
        <>
          <Sparkles className="h-4 w-4 text-marigold" aria-hidden="true" />
          <span>
            Ready! {count}/{VIBE_MAX} vibes selected
          </span>
        </>
      ) : (
        <span>
          Pick {VIBE_MIN} to {VIBE_MAX} vibes ({count}/{VIBE_MAX} selected)
        </span>
      )}
    </motion.div>
  )
}
