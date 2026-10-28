'use client'

import React from 'react'
import type { GenerativeUILayout, BudgetCategory, Plan, CuratedIdea } from '@/lib/engine/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Info, Sparkles, Compass } from 'lucide-react'
import { PlanProvider } from './registry/PlanContext'
import { VendorChecklist } from './registry/VendorChecklist'
import { IdeaGrid } from './registry/IdeaGrid'
import { QuoteReport } from './registry/QuoteReport'
import { ScenarioComparison } from './registry/ScenarioComparison'
import { cn } from '@/lib/utils'

export interface SmartInspectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  layout?: GenerativeUILayout
  activeTier?: 1 | 2 | 3
  plan?: Plan
  onCheckQuote?: (category: BudgetCategory) => void
  onCommitQuote?: (quoteId: string, tierId: string, adders: string[]) => void
  onUnlockQuote?: (quoteId: string) => void
  onAdoptIdea?: (idea: CuratedIdea) => void
  onRetractIdea?: (ideaId: string) => void
  onSelectLine?: (lineId: string) => void
}

export function SmartInspectorSheet({
  open,
  onOpenChange,
  layout,
  activeTier,
  plan,
  onCheckQuote,
  onCommitQuote,
  onUnlockQuote,
  onAdoptIdea,
  onRetractIdea,
  onSelectLine,
}: SmartInspectorSheetProps) {
  if (!layout) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-warm-ivory border-l border-royal-plum/10 p-6 flex flex-col gap-6 overflow-y-auto"
        data-testid="smart-inspector-sheet"
      >
        <PlanProvider
          plan={plan}
          onCheckQuote={onCheckQuote}
          onCommitQuote={onCommitQuote}
          onUnlockQuote={onUnlockQuote}
          onAdoptIdea={onAdoptIdea}
          onRetractIdea={onRetractIdea}
          onSelectLine={onSelectLine}
        >
          {/* Header Section */}
          <SheetHeader className="space-y-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-serif text-royal-plum/70">
                <Compass className="w-3.5 h-3.5 text-royal-plum/60" />
                <span className="font-hindi tracking-wide">महफ़िल Smart Inspector</span>
              </div>

              {/* Tier 3 Fallback Banner (GENUI-03, D-15) */}
              {activeTier === 3 && (
                <Badge
                  variant="outline"
                  className="bg-soft-ivory border-royal-plum/15 text-royal-plum/80 text-[11px] font-medium flex items-center gap-1"
                >
                  <Info className="w-3 h-3 text-royal-plum/60" />
                  <span>Viewing standard comparison layout</span>
                </Badge>
              )}
            </div>

            <SheetTitle className="font-serif text-2xl font-bold text-royal-plum leading-tight">
              {layout.layoutTitle}
            </SheetTitle>

            {/* Layout Summary & Editorial Rationale */}
            {layout.layoutSummary && (
              <div className="p-3.5 rounded-2xl bg-soft-ivory border border-royal-plum/10 text-xs text-royal-plum/80 leading-relaxed">
                {layout.layoutSummary}
              </div>
            )}
          </SheetHeader>

          {/* Registry Router: Iterates through allowlisted Generative UI sections */}
          <div className="flex flex-col gap-8 pb-8">
            {layout.sections.map((section) => (
              <div
                key={section.id}
                className="space-y-3 pt-2"
                data-testid={`genui-section-${section.component}`}
              >
                {/* Section Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg font-semibold text-royal-plum">
                      {section.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-soft-ivory/50 border-royal-plum/10 text-royal-plum/60 text-[10px] uppercase tracking-wider"
                    >
                      {section.variant}
                    </Badge>
                  </div>

                  {section.rationale && (
                    <p className="text-xs text-royal-plum/70 leading-relaxed">
                      {section.rationale}
                    </p>
                  )}
                </div>

                {/* Closed Registry Primitive Mount */}
                <div>
                  {section.component === 'VendorChecklist' && (
                    <VendorChecklist
                      lineIds={section.lineIds}
                      highlightEntityId={section.highlightEntityId}
                    />
                  )}

                  {section.component === 'IdeaGrid' && (
                    <IdeaGrid
                      ideaIds={section.ideaIds}
                      highlightEntityId={section.highlightEntityId}
                    />
                  )}

                  {section.component === 'QuoteReport' && (
                    <QuoteReport
                      quoteId={section.quoteIds?.[0]}
                    />
                  )}

                  {section.component === 'ScenarioComparison' && (
                    <ScenarioComparison
                      quoteIds={section.quoteIds}
                      lineId={section.lineIds?.[0]}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </PlanProvider>
      </SheetContent>
    </Sheet>
  )
}
