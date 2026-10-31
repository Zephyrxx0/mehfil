'use client'

import React from 'react'
import type { EventBrief, Plan } from '@/lib/engine/types'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { isPastDate, parseISODate } from '@/lib/dates'
import { VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'
import { resolveStarterBrief } from './StarterChips'
import { PlanRevealOverlay } from './PlanRevealOverlay'
import { WizardFooter } from './WizardFooter'
import { WizardProgress } from './WizardProgress'
import { WizardStepContent } from './WizardStepContent'
import { buildBriefFromForm, instantiatePlanFromForm } from './hooks/briefForm'
import { useBriefForm } from './hooks/useBriefForm'
import { usePlanSubmission } from './hooks/usePlanSubmission'
import { useWizardStep } from './hooks/useWizardStep'
import type { WizardStep } from './wizardSteps'

export type { WizardStep }

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
  const [step, setStep] = useWizardStep(controlledStep, onStepChange)
  const { form, actions } = useBriefForm(initialBrief)
  const { isRevealing, submitError, submitPlan } = usePlanSubmission(onPlanCreated)

  const handleStarterSelect = (starterBrief: EventBrief) => {
    submitPlan(() => instantiatePlanFromBrief(resolveStarterBrief(starterBrief)))
  }

  const handleGenerate = (withVibes: boolean) => {
    const brief = buildBriefFromForm(form, withVibes)
    submitPlan(() => instantiatePlanFromForm(brief, withVibes, form.protectedMoment))
  }

  if (isRevealing) return <PlanRevealOverlay />

  const isSwatchesValid =
    form.selectedSwatchIds.length >= VIBE_MIN && form.selectedSwatchIds.length <= VIBE_MAX
  const isDateValid = parseISODate(form.eventDate) !== undefined && !isPastDate(form.eventDate)

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-6 lg:min-h-0">
      <WizardProgress step={step} />

      {/*
        The card has a fixed height on desktop: the body scrolls inside it and the
        footer is pinned to its bottom edge, so Back and Next sit in the same place on
        every step. On small screens the card fills the viewport and the footer sticks
        to the bottom for the same reason.
      */}
      <div className="flex flex-1 flex-col rounded-3xl lg:flex-none lg:border lg:border-royal-plum/10 lg:bg-white/40 lg:h-[clamp(520px,calc(100dvh-16rem),720px)]">
        <div className="min-h-0 flex-1 lg:overflow-y-auto lg:p-8">
          <WizardStepContent
            step={step}
            form={form}
            actions={actions}
            onStarterSelect={handleStarterSelect}
          />
        </div>

        <WizardFooter
          step={step}
          submitError={submitError}
          isRevealing={isRevealing}
          canGoNext={step !== 1 || isDateValid}
          isSwatchesValid={isSwatchesValid}
          onBack={() => setStep((s) => Math.max(1, s - 1) as WizardStep)}
          onNext={() => setStep((s) => (s + 1) as WizardStep)}
          onConfirmVibes={() => setStep(5)}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  )
}
