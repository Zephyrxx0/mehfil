'use client'

import React from 'react'
import type { CuratedIdea, Plan } from '@/lib/engine/types'
import { QuoteIntakeSheet } from '@/components/quotes/QuoteIntakeSheet'
import { SmartInspectorSheet } from '@/components/quotes/SmartInspectorSheet'
import type { useQuotePanels } from './hooks/useQuotePanels'

interface WorkspaceQuoteSheetsProps {
  plan: Plan
  quotes: ReturnType<typeof useQuotePanels>
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
}

/** The two quote side panels: the intake sandbox and the smart inspector slide-over. */
export function WorkspaceQuoteSheets({
  plan,
  quotes,
  onAdoptIdea,
  onRetractIdea,
}: WorkspaceQuoteSheetsProps) {
  return (
    <>
      {/* Quarantined quote intake sandbox (QUOTE-01, QUOTE-02, D-01) */}
      <QuoteIntakeSheet
        open={quotes.intake.open}
        onOpenChange={quotes.intake.setOpen}
        category={quotes.intake.category}
        guestCount={plan.brief.guestCount}
        plan={plan}
        onCommitQuote={quotes.commitFromIntake}
      />

      {/* Contextual smart inspector slide-over (GENUI-01, GENUI-02, GENUI-03, D-14) */}
      <SmartInspectorSheet
        open={quotes.inspector.open}
        onOpenChange={quotes.inspector.setOpen}
        layout={quotes.inspector.layout}
        activeTier={quotes.inspector.tier}
        plan={plan}
        onCheckQuote={quotes.checkQuote}
        onCommitQuote={quotes.commitFromInspector}
        onUnlockQuote={quotes.unlockFromInspector}
        onAdoptIdea={onAdoptIdea}
        onRetractIdea={onRetractIdea}
      />
    </>
  )
}
