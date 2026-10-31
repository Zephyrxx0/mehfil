'use client'

import React, { useState } from 'react'
import type { Plan, PlanVersionRecord } from '@/lib/engine/types'
import type { StyleDimensions } from '@/lib/ai/schemas'
import { Button } from '@/components/ui/button'
import { StyleDNARetuneSheet } from './StyleDNARetuneSheet'
import { StyleDNADimensions } from './StyleDNADimensions'
import { StyleDNAFallbackNote } from './StyleDNAFallbackNote'
import { StyleDNAHeader } from './StyleDNAHeader'
import { StyleDNAPalette } from './StyleDNAPalette'
import { StyleDNAResetDialog } from './StyleDNAResetDialog'
import { resolveStyleDNAView } from './style-dna-view'
import { useRetryExtraction } from './useRetryExtraction'

export interface StyleDNACardProps {
  plan: Plan
  currentVersion?: PlanVersionRecord
  isReadOnly?: boolean
  isExtracting?: boolean
  onRetuneStyle?: (newDimensions: StyleDimensions) => void
  onResetToBaseline?: () => void
  onRetryExtraction?: () => void
}

export function StyleDNACard({
  plan,
  currentVersion,
  isReadOnly = false,
  isExtracting = false,
  onRetuneStyle,
  onResetToBaseline,
  onRetryExtraction,
}: StyleDNACardProps) {
  const [isRetuneOpen, setIsRetuneOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const { isRetrying, handleRetry } = useRetryExtraction(onRetryExtraction)

  const { dimensions, topDimensions, palette, vibeStatement, protectedQuote, isFallbackTier } =
    resolveStyleDNAView(plan, currentVersion)

  return (
    <>
      <section aria-labelledby="style-dna-heading" className="flex flex-col gap-8">
        <StyleDNAHeader
          showEdit={!isReadOnly && Boolean(onRetuneStyle)}
          onEdit={() => setIsRetuneOpen(true)}
        />

        {isExtracting ? (
          <div role="status" className="border-y border-royal-plum/10 py-10 text-center">
            <p className="text-base font-medium text-royal-plum">
              Analyzing visual vibes &amp; balancing allocations...
            </p>
            <p className="mt-1 text-sm text-royal-plum/70">
              Calibrating 8 aesthetic dimensions and protected floor
            </p>
          </div>
        ) : (
          <>
            <blockquote className="border-l-2 border-marigold pl-4">
              <p className="font-serif text-xl italic leading-relaxed text-royal-plum">
                &ldquo;{vibeStatement}&rdquo;
              </p>
            </blockquote>

            <div className="grid gap-8 sm:grid-cols-2">
              <StyleDNAPalette palette={palette} />
              <StyleDNADimensions topDimensions={topDimensions} />
            </div>

            {protectedQuote && (
              <div className="border-l-2 border-gulabi-rose bg-gulabi-rose/10 px-4 py-3">
                <h3 className="text-sm font-semibold text-royal-plum">Protected Moment Quote</h3>
                <p className="mt-1 font-serif text-base italic text-royal-plum">
                  &ldquo;{protectedQuote}&rdquo;
                </p>
              </div>
            )}

            {isFallbackTier && (
              <StyleDNAFallbackNote
                isRetrying={isRetrying}
                onRetry={onRetryExtraction && !isReadOnly ? handleRetry : undefined}
              />
            )}

            {/* Reset to Baseline (v1) destructive action (D-11) */}
            {!isReadOnly && onResetToBaseline && (
              <div className="border-t border-royal-plum/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsResetDialogOpen(true)}
                  className="-ml-3 text-royal-plum/70 hover:bg-terracotta/10 hover:text-terracotta"
                >
                  Reset to Baseline (v1)
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Retune Sliders Sheet */}
      {onRetuneStyle && (
        <StyleDNARetuneSheet
          open={isRetuneOpen}
          onOpenChange={setIsRetuneOpen}
          initialDimensions={dimensions}
          onSave={onRetuneStyle}
        />
      )}

      <StyleDNAResetDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        onConfirm={() => {
          onResetToBaseline?.()
          setIsResetDialogOpen(false)
        }}
      />
    </>
  )
}
