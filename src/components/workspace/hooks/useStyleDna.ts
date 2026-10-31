'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { extractDeterministicStyleDNA, type VibeTradeoffs } from '@/lib/ai/heuristic'
import { deterministicRunRecord } from '@/lib/ai/run-record'
import {
  AgentRunRecordSchema,
  StyleDNASchema,
  type AgentRunRecord,
  type StyleDimensions,
  type StyleDNA,
} from '@/lib/ai/schemas'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { computeCategoryDeltas } from '@/lib/engine/diff'
import { applyStyleModulationToPlan, generateStyleModulationRationale } from '@/lib/engine/style'
import type { Plan } from '@/lib/engine/types'
import { createLogger } from '@/lib/logger'
import { VIBE_MIN } from '@/lib/vibe-limits'
import type { ApplyChangeInput } from './usePlanEditor'

const logger = createLogger('style-dna')

const DEFAULT_TRADEOFFS: VibeTradeoffs = {
  feastVsSpectacle: 'feast',
  intimateVsGrand: 'intimate',
  heritageVsModern: 'heritage',
}

const DEFAULT_PALETTE: StyleDNA['namedPalette'] = [
  { name: 'Marigold Amber', hex: '#F7C873' },
  { name: 'Gulabi Rose', hex: '#F2A7B8' },
  { name: 'Royal Plum', hex: '#3A2442' },
  { name: 'Warm Ivory', hex: '#FFF8EE' },
]

const StyleDnaResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ styleDNA: StyleDNASchema, runRecord: AgentRunRecordSchema }),
})

export interface UseStyleDnaOptions {
  plan: Plan
  isReadOnly: boolean
  snapshotOf: (versionNumber: number) => Plan | undefined
  getPlan: () => Plan
  replacePlan: (plan: Plan) => void
  applyChange: (input: ApplyChangeInput) => void
  commitNow: (plan: Plan, reason: string) => Promise<void>
  discardPending: () => void
}

/**
 * Style DNA flow (VIBE-04): ask the style route, apply the result to the budget as a new
 * version, retune it with sliders, or go back to the baseline plan. The server falls back to
 * pure code on any model failure, and so does this hook if the request itself fails.
 */
export function useStyleDna({
  plan,
  isReadOnly,
  snapshotOf,
  getPlan,
  replacePlan,
  applyChange,
  commitNow,
  discardPending,
}: UseStyleDnaOptions) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [rationale, setRationale] = useState('')
  const hasTriggeredInitialExtraction = useRef(false)

  const applyExtracted = useCallback(
    (styleDNA: StyleDNA, runRecord?: AgentRunRecord) => {
      const current = getPlan()
      const next = applyStyleModulationToPlan(current, styleDNA)
      const why = generateStyleModulationRationale(styleDNA, computeCategoryDeltas(current, next))

      applyChange({
        next,
        description: why,
        save: { mode: 'immediate', meta: { run_record: runRecord, styleDNA } },
      })
      setRationale(why)
      setShowBanner(true)
    },
    [applyChange, getPlan]
  )

  const extract = useCallback(
    async (swatchIds: string[], protectedMomentQuote = '', tradeoffs?: VibeTradeoffs) => {
      setIsExtracting(true)
      const chosenTradeoffs = tradeoffs ?? DEFAULT_TRADEOFFS
      try {
        const response = await fetch('/api/style-dna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedSwatchIds: swatchIds,
            protectedMomentQuote,
            tradeoffs: chosenTradeoffs,
          }),
        })
        if (!response.ok) throw new Error(`style route answered HTTP ${response.status}`)

        const parsed = StyleDnaResponseSchema.safeParse(await response.json())
        if (!parsed.success) throw new Error('style route answered with an unexpected payload')
        applyExtracted(parsed.data.data.styleDNA, parsed.data.data.runRecord)
      } catch (err) {
        logger.warn('style request failed, using the built-in estimate', { err })
        const fallback = extractDeterministicStyleDNA(
          swatchIds,
          protectedMomentQuote,
          chosenTradeoffs
        )
        applyExtracted(fallback, deterministicRunRecord('client_fallback'))
      } finally {
        setIsExtracting(false)
      }
    },
    [applyExtracted]
  )

  // Beat 2 of the two-beat reveal: the plan appears at once, then style arrives.
  const { vibeSwatches, protectedMomentQuote, tradeoffs } = plan.brief
  useEffect(() => {
    if (
      vibeSwatches &&
      vibeSwatches.length >= VIBE_MIN &&
      !plan.styleDNA &&
      !hasTriggeredInitialExtraction.current
    ) {
      hasTriggeredInitialExtraction.current = true
      void extract(vibeSwatches, protectedMomentQuote, tradeoffs)
    }
  }, [vibeSwatches, protectedMomentQuote, tradeoffs, plan.styleDNA, extract])

  const retry = useCallback(async () => {
    if (vibeSwatches && vibeSwatches.length >= VIBE_MIN) {
      await extract(vibeSwatches, protectedMomentQuote, tradeoffs)
    }
  }, [vibeSwatches, protectedMomentQuote, tradeoffs, extract])

  /** Applies new slider positions to the style, as a new version (D-08). */
  const retune = useCallback(
    (dimensions: StyleDimensions) => {
      if (isReadOnly) return
      const current = getPlan()
      const base: StyleDNA = current.styleDNA ?? {
        dimensions,
        namedPalette: DEFAULT_PALETTE,
        vibeStatement: current.brief.vibeStatement || 'Calibrated custom aesthetic vibe.',
        protectedCategory: current.brief.protectedCategory,
        protectedMomentQuote: current.brief.protectedMomentQuote || '',
      }
      const retuned: StyleDNA = { ...base, dimensions }
      const next = applyStyleModulationToPlan(current, retuned)
      const why = generateStyleModulationRationale(retuned, computeCategoryDeltas(current, next))

      applyChange({
        next,
        description: `Retuned Style: ${why}`,
        save: { mode: 'immediate', meta: { styleDNA: retuned } },
      })
    },
    [applyChange, getPlan, isReadOnly]
  )

  /** Drops the style and goes back to the plan as the archetype first made it (D-11). */
  const resetToBaseline = useCallback(async () => {
    if (isReadOnly) return
    const current = getPlan()
    const first = snapshotOf(1)

    const baseline: Plan = first
      ? { ...first, styleDNA: undefined, brief: { ...first.brief, vibeStatement: undefined } }
      : instantiatePlanFromBrief({
          ...current.brief,
          vibeSwatches: undefined,
          protectedMomentQuote: undefined,
          vibeStatement: undefined,
        })

    // A waiting edit would otherwise land after the reset and undo it.
    discardPending()
    replacePlan(baseline)
    setShowBanner(false)
    await commitNow(baseline, 'Reset celebration plan to baseline archetype (v1)')
  }, [commitNow, discardPending, getPlan, isReadOnly, replacePlan, snapshotOf])

  return {
    isExtracting,
    banner: showBanner && rationale ? { rationale } : null,
    dismissBanner: () => setShowBanner(false),
    retry,
    retune,
    resetToBaseline,
  }
}
