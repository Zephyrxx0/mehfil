'use client'

import React, { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { EventBrief, EventType, BudgetCategory, Plan } from '@/lib/engine/types'
import { parseINRInput } from '@/lib/engine/currency'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { StarterChips, resolveStarterBrief } from './StarterChips'
import { StepEventBasics } from './StepEventBasics'
import { StepScaleBudget } from './StepScaleBudget'
import { StepNuances } from './StepNuances'
import { StepVibeSwatches } from './StepVibeSwatches'
import { StepVibeTradeoffs, type VibeTradeoffs } from './StepVibeTradeoffs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clampToToday, isPastDate, parseISODate, rollForwardToFuture } from '@/lib/dates'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'
import { createLogger } from '@/lib/logger'
const logger = createLogger('brief-wizard')

export type WizardStep = 1 | 2 | 3 | 4 | 5

const STEP_TITLES: Record<WizardStep, string> = {
  1: 'The occasion',
  2: 'Guests and budget',
  3: 'Details that matter',
  4: 'The look and feel',
  5: 'What must not be compromised',
}

/** Short names shown under the progress bars on wide screens. */
const STEP_SHORT: Record<WizardStep, string> = {
  1: 'Occasion',
  2: 'Scale',
  3: 'Details',
  4: 'Look & feel',
  5: 'Priorities',
}

/** The default date moves forward a year at a time so it is never in the past. */
const DEFAULT_EVENT_DATE = '2026-11-20'

interface BriefWizardProps {
  /**
   * Hand the finished plan off (persist + navigate). It may be async; the reveal
   * overlay stays up until it resolves, so the user never sees the wizard flash
   * back. If it rejects, the wizard shows a retry instead of silently returning.
   */
  onPlanCreated: (plan: Plan) => void | Promise<void>
  initialBrief?: EventBrief
  /** Controlled step (e.g. from the URL). Uncontrolled when omitted. */
  step?: WizardStep
  onStepChange?: (step: WizardStep) => void
}

export function BriefWizard({
  onPlanCreated,
  initialBrief,
  step: controlledStep,
  onStepChange,
}: BriefWizardProps) {
  const [localStep, setLocalStep] = useState<WizardStep>(1)
  const step = controlledStep ?? localStep
  const setStep = (next: WizardStep | ((s: WizardStep) => WizardStep)) => {
    const value = typeof next === 'function' ? next(step) : next
    if (onStepChange) onStepChange(value)
    else setLocalStep(value)
  }
  const [isRevealing, setIsRevealing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Guards against double submits: a second click while the first is in flight is ignored.
  const isSubmittingRef = useRef(false)

  // Form State
  const [title, setTitle] = useState(initialBrief?.title ?? 'My Celebration')
  const [eventType, setEventType] = useState<EventType>(initialBrief?.eventType ?? 'wedding')
  const [eventDate, setEventDate] = useState(
    initialBrief?.eventDate ?? rollForwardToFuture(DEFAULT_EVENT_DATE)
  )
  const [city, setCity] = useState(initialBrief?.city ?? 'Delhi')
  const [guestCount, setGuestCount] = useState(initialBrief?.guestCount ?? 300)
  const [rawBudgetInput, setRawBudgetInput] = useState(
    initialBrief ? `${Math.round(initialBrief.totalBudgetPaise / 100_000_00)}L` : '25L'
  )
  const [protectedCategory, setProtectedCategory] = useState<BudgetCategory>(
    initialBrief?.protectedCategory ?? 'catering'
  )
  const [nuances, setNuances] = useState<string[]>(initialBrief?.nuances ?? [])
  const [customNotes, setCustomNotes] = useState(initialBrief?.customNotes ?? '')

  // Vibe & Style DNA State (D-01, D-03, D-04)
  const [selectedSwatchIds, setSelectedSwatchIds] = useState<string[]>(
    initialBrief?.vibeSwatches ?? []
  )
  const [protectedMoment, setProtectedMoment] = useState<string>(
    initialBrief?.protectedMomentQuote ?? ''
  )
  const [tradeoffs, setTradeoffs] = useState<VibeTradeoffs>(
    initialBrief?.tradeoffs ?? {
      feastVsSpectacle: 'feast',
      intimateVsGrand: 'intimate',
      heritageVsModern: 'heritage',
    }
  )

  /**
   * One path for every "create the plan" action. Shows the reveal overlay at
   * once (no dead click), runs the hand-off, and keeps the overlay up until it
   * resolves — on success the page navigates away and this component unmounts.
   * A failed hand-off drops the overlay and shows a retry. Re-entry is blocked.
   */
  const submitPlan = (buildPlan: () => Plan) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setSubmitError(null)
    setIsRevealing(true)

    // Build on the next tick so the overlay paints first, then hand off. A minimum
    // reveal time keeps the animation from flashing without ever adding latency to
    // a hand-off that takes longer than the beat.
    const minReveal = new Promise<void>((resolve) => setTimeout(resolve, 300))
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

  const handleStarterSelect = (starterBrief: EventBrief) => {
    submitPlan(() => instantiatePlanFromBrief(resolveStarterBrief(starterBrief)))
  }

  const handleGenerate = (withVibes = false) => {
    let budgetPaise = 250_000_000
    try {
      budgetPaise = parseINRInput(rawBudgetInput)
    } catch {
      // Fallback
    }

    const brief: EventBrief = {
      title: title.trim() || 'My Celebration',
      eventType,
      // Last line of defence: no plan is ever created for a day that has passed.
      eventDate: clampToToday(eventDate),
      city: city.trim() || 'Delhi',
      guestCount: guestCount || 100,
      totalBudgetPaise: budgetPaise,
      protectedCategory,
      nuances,
      customNotes,
      ...(withVibes || selectedSwatchIds.length >= VIBE_MIN
        ? {
            vibeSwatches: selectedSwatchIds,
            protectedMomentQuote: protectedMoment.trim() || undefined,
            tradeoffs,
          }
        : {}),
    }

    submitPlan(() => {
      const plan = instantiatePlanFromBrief(brief)
      if (withVibes && protectedMoment.trim()) {
        plan.brief.protectedMomentQuote = protectedMoment.trim()
      }
      return plan
    })
  }

  const isSwatchesValid =
    selectedSwatchIds.length >= VIBE_MIN && selectedSwatchIds.length <= VIBE_MAX
  const isDateValid = parseISODate(eventDate) !== undefined && !isPastDate(eventDate)
  const canGoNext = step !== 1 || isDateValid

  if (isRevealing) {
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
        <p className="mt-2 text-sm text-royal-plum/60">
          Applying integer paise precision and milestone scheduling
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-6 lg:min-h-0">
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold text-royal-plum sm:text-3xl">
            {STEP_TITLES[step]}
          </h2>
          <p className="shrink-0 text-sm tabular-nums text-royal-plum/60">Step {step} of 5</p>
        </div>
        <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
          {([1, 2, 3, 4, 5] as WizardStep[]).map((s) => (
            <li key={s} className="flex flex-col gap-1.5">
              <div
                className={cn(
                  'h-0.5 transition-colors',
                  s <= step ? 'bg-royal-plum' : 'bg-royal-plum/15'
                )}
              />
              <span
                className={cn(
                  'hidden text-xs font-medium transition-colors lg:block',
                  s === step ? 'text-royal-plum' : 'text-royal-plum/45'
                )}
              >
                {STEP_SHORT[s]}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/*
        The card has a fixed height on desktop: the body scrolls inside it and the
        footer is pinned to its bottom edge, so Back and Next sit in the same place on
        every step. On small screens the card fills the viewport and the footer sticks
        to the bottom for the same reason.
      */}
      <div className="flex flex-1 flex-col rounded-3xl lg:flex-none lg:border lg:border-royal-plum/10 lg:bg-white/40 lg:h-[clamp(520px,calc(100dvh-16rem),720px)]">
        <div className="min-h-0 flex-1 lg:overflow-y-auto lg:p-8">
          {step === 1 && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
              <StepEventBasics
                title={title}
                eventType={eventType}
                eventDate={eventDate}
                city={city}
                onChange={(fields) => {
                  if (fields.title !== undefined) setTitle(fields.title)
                  if (fields.eventType !== undefined) {
                    setEventType(fields.eventType)
                    // Auto-update recommended protected category based on archetype
                    if (fields.eventType === 'wedding') setProtectedCategory('catering')
                    if (fields.eventType === 'birthday') setProtectedCategory('photo_film')
                    if (fields.eventType === 'community') setProtectedCategory('entertainment')
                  }
                  if (fields.eventDate !== undefined) setEventDate(fields.eventDate)
                  if (fields.city !== undefined) setCity(fields.city)
                }}
              />
              <StarterChips onSelect={handleStarterSelect} />
            </div>
          )}

          {step === 2 && (
            <StepScaleBudget
              guestCount={guestCount}
              rawBudgetInput={rawBudgetInput}
              protectedCategory={protectedCategory}
              onChange={(fields) => {
                if (fields.guestCount !== undefined) setGuestCount(fields.guestCount)
                if (fields.rawBudgetInput !== undefined) setRawBudgetInput(fields.rawBudgetInput)
                if (fields.protectedCategory !== undefined)
                  setProtectedCategory(fields.protectedCategory)
              }}
            />
          )}

          {step === 3 && (
            <StepNuances
              nuances={nuances}
              customNotes={customNotes}
              onChange={(fields) => {
                if (fields.nuances !== undefined) setNuances(fields.nuances)
                if (fields.customNotes !== undefined) setCustomNotes(fields.customNotes)
              }}
            />
          )}

          {step === 4 && (
            <StepVibeSwatches
              selectedSwatchIds={selectedSwatchIds}
              onChange={setSelectedSwatchIds}
            />
          )}

          {step === 5 && (
            <StepVibeTradeoffs
              protectedMoment={protectedMoment}
              onProtectedMomentChange={setProtectedMoment}
              tradeoffs={tradeoffs}
              onTradeoffsChange={setTradeoffs}
            />
          )}
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-royal-plum/10 bg-warm-ivory/95 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:rounded-b-3xl lg:bg-transparent lg:px-8 lg:py-4 lg:backdrop-blur-none">
          {submitError && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {submitError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className={cn(step === 1 && 'invisible')}
              tabIndex={step === 1 ? -1 : 0}
              aria-hidden={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1) as WizardStep)}
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              {step === 3 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isRevealing}
                  onClick={() => handleGenerate(false)}
                >
                  Skip &amp; Generate
                </Button>
              )}

              {step < 4 && (
                <Button
                  type="button"
                  className="min-w-28"
                  disabled={!canGoNext}
                  aria-disabled={!canGoNext}
                  onClick={() => setStep((s) => (s + 1) as WizardStep)}
                >
                  Next
                </Button>
              )}

              {step === 4 && (
                <Button
                  type="button"
                  className="min-w-28"
                  disabled={!isSwatchesValid}
                  aria-disabled={!isSwatchesValid}
                  onClick={() => setStep(5)}
                >
                  Confirm {VIBE_MIN} to {VIBE_MAX} Vibes
                </Button>
              )}

              {step === 5 && (
                <Button
                  type="button"
                  className="min-w-40"
                  disabled={isRevealing}
                  aria-disabled={isRevealing}
                  aria-busy={isRevealing}
                  onClick={() => handleGenerate(true)}
                >
                  {isRevealing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Infusing...
                    </>
                  ) : (
                    'Infuse Style DNA'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
