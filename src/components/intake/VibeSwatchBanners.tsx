'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, Sparkles, Undo2 } from 'lucide-react'

interface VibeSwatchBannersProps {
  /** Shown when a pick was refused (e.g. the maximum is reached). */
  warningMessage: string | null
  /** The assistant's explanation of what it picked; offers an undo. */
  assistantNote: { text: string } | null
  onUndo: () => void
}

const ENTER = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export function VibeSwatchBanners({
  warningMessage,
  assistantNote,
  onUndo,
}: VibeSwatchBannersProps) {
  return (
    <AnimatePresence>
      {warningMessage && (
        <motion.div
          key="warning"
          {...ENTER}
          className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-900"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>{warningMessage}</span>
        </motion.div>
      )}
      {assistantNote && (
        <motion.div
          key="assistant"
          {...ENTER}
          className="flex items-start gap-2 rounded-lg border border-marigold/40 bg-marigold/15 px-3 py-2 text-sm text-royal-plum"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-royal-plum" aria-hidden="true" />
          <span className="flex-1">{assistantNote.text}</span>
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold underline-offset-2 hover:underline"
          >
            <Undo2 className="h-3 w-3" aria-hidden="true" />
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
