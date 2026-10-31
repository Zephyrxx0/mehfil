'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'
import type { WizardStep } from './wizardSteps'

interface WizardFooterProps {
  step: WizardStep
  submitError: string | null
  isRevealing: boolean
  /** Step 1 needs a valid, future event date before moving on. */
  canGoNext: boolean
  /** Step 4 needs between VIBE_MIN and VIBE_MAX swatches. */
  isSwatchesValid: boolean
  onBack: () => void
  onNext: () => void
  onConfirmVibes: () => void
  onGenerate: (withVibes: boolean) => void
}

type PrimaryActionProps = Omit<WizardFooterProps, 'submitError' | 'onBack'>

/** The one forward button for the current step. */
function PrimaryAction({
  step,
  isRevealing,
  canGoNext,
  isSwatchesValid,
  onNext,
  onConfirmVibes,
  onGenerate,
}: PrimaryActionProps) {
  if (step < 4) {
    return (
      <Button
        type="button"
        className="min-w-28"
        disabled={!canGoNext}
        aria-disabled={!canGoNext}
        onClick={onNext}
      >
        Next
      </Button>
    )
  }

  if (step === 4) {
    return (
      <Button
        type="button"
        className="min-w-28"
        disabled={!isSwatchesValid}
        aria-disabled={!isSwatchesValid}
        onClick={onConfirmVibes}
      >
        Confirm {VIBE_MIN} to {VIBE_MAX} Vibes
      </Button>
    )
  }

  return (
    <Button
      type="button"
      className="min-w-40"
      disabled={isRevealing}
      aria-disabled={isRevealing}
      aria-busy={isRevealing}
      onClick={() => onGenerate(true)}
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
  )
}

/** Back and the step's forward actions, pinned so they never move between steps. */
export function WizardFooter(props: WizardFooterProps) {
  const { step, submitError, isRevealing, onBack, onGenerate } = props

  return (
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
          onClick={onBack}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {step === 3 && (
            <Button
              type="button"
              variant="outline"
              disabled={isRevealing}
              onClick={() => onGenerate(false)}
            >
              Skip &amp; Generate
            </Button>
          )}
          <PrimaryAction {...props} />
        </div>
      </div>
    </div>
  )
}
