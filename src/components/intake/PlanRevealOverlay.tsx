import React from 'react'
import { Loader2 } from 'lucide-react'

/** Shown from the moment the user asks for the plan until the hand-off completes. */
export function PlanRevealOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center py-24 text-center lg:min-h-[420px]"
    >
      <Loader2 className="mb-5 h-8 w-8 animate-spin text-marigold" aria-hidden="true" />
      <h2 className="font-serif text-2xl font-bold text-royal-plum">
        Balancing budget &amp; timeline...
      </h2>
      <p className="mt-2 text-sm text-royal-plum/70">
        Applying integer paise precision and milestone scheduling
      </p>
    </div>
  )
}
