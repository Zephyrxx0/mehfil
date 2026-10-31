import React from 'react'
import { cn } from '@/lib/utils'
import { STEP_SHORT, STEP_TITLES, WIZARD_STEPS, type WizardStep } from './wizardSteps'

/** Step title, "Step n of 5", and the row of progress bars. */
export function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl font-bold text-royal-plum sm:text-3xl">
          {STEP_TITLES[step]}
        </h2>
        <p className="shrink-0 text-sm tabular-nums text-royal-plum/70">Step {step} of 5</p>
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
        {WIZARD_STEPS.map((s) => (
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
                s === step ? 'text-royal-plum' : 'text-royal-plum/70'
              )}
            >
              {STEP_SHORT[s]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
