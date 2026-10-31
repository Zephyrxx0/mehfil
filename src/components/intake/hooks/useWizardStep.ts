import { useState } from 'react'
import type { WizardStep } from '../wizardSteps'

type StepUpdate = WizardStep | ((current: WizardStep) => WizardStep)

/**
 * The current wizard step. Controlled when `controlledStep` is given (e.g. from
 * the URL; changes are reported through `onStepChange`), otherwise kept locally.
 */
export function useWizardStep(
  controlledStep?: WizardStep,
  onStepChange?: (step: WizardStep) => void
): readonly [WizardStep, (next: StepUpdate) => void] {
  const [localStep, setLocalStep] = useState<WizardStep>(1)
  const step = controlledStep ?? localStep

  const setStep = (next: StepUpdate) => {
    const value = typeof next === 'function' ? next(step) : next
    if (onStepChange) onStepChange(value)
    else setLocalStep(value)
  }

  return [step, setStep]
}
