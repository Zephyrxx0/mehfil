'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export interface UndoActionBarProps {
  message: string | null
  onUndo: () => void
  onDismiss: () => void
  durationMs?: number
}

export function UndoActionBar({
  message,
  onUndo,
  onDismiss,
  durationMs = 8000,
}: UndoActionBarProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!message) {
      setProgress(100)
      return
    }

    setProgress(100)
    const startTime = Date.now()
    const interval = 50

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100)
      setProgress(remainingPct)

      if (elapsed >= durationMs) {
        clearInterval(timer)
        onDismiss()
      }
    }, interval)

    return () => clearInterval(timer)
  }, [message, durationMs, onDismiss])

  if (!message) return null

  const handleUndo = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50)
      } catch {
        // Safe fallback in unsupported contexts
      }
    }
    onUndo()
    onDismiss()
  }

  return (
    <div
      data-testid="undo-action-bar"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] flex flex-col overflow-hidden rounded-full bg-royal-plum text-warm-ivory shadow-2xl border border-white/20 backdrop-blur-md"
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-xs font-medium max-w-xs sm:max-w-md truncate">
          {message}
        </span>

        <button
          type="button"
          onClick={handleUndo}
          className="inline-flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-bold text-royal-plum hover:bg-marigold/90 active:scale-95 transition shrink-0"
        >
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss undo notification"
          className="rounded-full p-1 text-warm-ivory/60 hover:text-warm-ivory transition shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 8-Second Countdown Progress Bar (D-14) */}
      <div className="w-full h-1 bg-royal-plum/40 overflow-hidden">
        <div
          data-testid="undo-progress-bar"
          className="h-full bg-marigold transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
