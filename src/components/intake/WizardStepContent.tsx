'use client'

import React from 'react'
import type { EventBrief } from '@/lib/engine/types'
import type { BriefFormState } from './hooks/briefForm'
import type { BriefFormActions } from './hooks/useBriefForm'
import { StarterChips } from './StarterChips'
import { StepEventBasics } from './StepEventBasics'
import { StepNuances } from './StepNuances'
import { StepScaleBudget } from './StepScaleBudget'
import { StepVibeSwatches } from './StepVibeSwatches'
import { StepVibeTradeoffs } from './StepVibeTradeoffs'
import type { WizardStep } from './wizardSteps'

interface WizardStepContentProps {
  step: WizardStep
  form: BriefFormState
  actions: BriefFormActions
  onStarterSelect: (brief: EventBrief) => void
}

/** The body of the wizard card: the one step that is currently showing. */
export function WizardStepContent({
  step,
  form,
  actions,
  onStarterSelect,
}: WizardStepContentProps) {
  switch (step) {
    case 1:
      return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
          <StepEventBasics
            title={form.title}
            eventType={form.eventType}
            eventDate={form.eventDate}
            city={form.city}
            onChange={actions.changeBasics}
          />
          <StarterChips onSelect={onStarterSelect} />
        </div>
      )
    case 2:
      return (
        <StepScaleBudget
          guestCount={form.guestCount}
          rawBudgetInput={form.rawBudgetInput}
          protectedCategory={form.protectedCategory}
          onChange={actions.changeScale}
        />
      )
    case 3:
      return (
        <StepNuances
          nuances={form.nuances}
          customNotes={form.customNotes}
          onChange={actions.changeNuances}
        />
      )
    case 4:
      return (
        <StepVibeSwatches
          selectedSwatchIds={form.selectedSwatchIds}
          onChange={actions.setSwatches}
        />
      )
    case 5:
      return (
        <StepVibeTradeoffs
          protectedMoment={form.protectedMoment}
          onProtectedMomentChange={actions.setProtectedMoment}
          tradeoffs={form.tradeoffs}
          onTradeoffsChange={actions.setTradeoffs}
        />
      )
  }
}
