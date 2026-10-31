import { useRef, useState } from 'react'
import type { Plan } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('brief-wizard')

/** Shortest time the reveal overlay stays up, so it never flashes. */
const MIN_REVEAL_MS = 300

/**
 * One path for every "create the plan" action. Shows the reveal overlay at
 * once (no dead click), runs the hand-off, and keeps the overlay up until it
 * resolves — on success the page navigates away and the wizard unmounts.
 * A failed hand-off drops the overlay and shows a retry. Re-entry is blocked.
 */
export function usePlanSubmission(onPlanCreated: (plan: Plan) => void | Promise<void>) {
  const [isRevealing, setIsRevealing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Guards against double submits: a second click while the first is in flight is ignored.
  const isSubmittingRef = useRef(false)

  const submitPlan = (buildPlan: () => Plan) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setSubmitError(null)
    setIsRevealing(true)

    // Build on the next tick so the overlay paints first, then hand off. A minimum
    // reveal time keeps the animation from flashing without ever adding latency to
    // a hand-off that takes longer than the beat.
    const minReveal = new Promise<void>((resolve) => setTimeout(resolve, MIN_REVEAL_MS))
    const run = (async () => {
      const plan = buildPlan()
      await Promise.all([Promise.resolve(onPlanCreated(plan)), minReveal])
    })()

    run.catch((err) => {
      logger.error('[BriefWizard] failed to create plan:', err)
      isSubmittingRef.current = false
      setIsRevealing(false)
      setSubmitError('We could not open your plan just now. Please try again.')
    })
  }

  return { isRevealing, submitError, submitPlan }
}
