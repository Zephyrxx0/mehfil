'use client'

import { useState } from 'react'
import type { Plan, VendorQuote } from '@/lib/engine/types'
import { previewQuoteDisplacement } from '@/lib/engine/budget'

interface UseQuoteCheckStateOptions {
  quote: VendorQuote
  plan?: Plan
  onCommit?: (tierId: string, activeAdderIds: string[]) => void
  onViewSource?: (sourceAnchor: string) => void
}

/**
 * Selection state for one vendor quote card: the chosen package tier, the enabled omission adders,
 * and the raw-text dialog. It also derives the live package total and the plan displacement
 * preview. All figures come from the engine, never from this hook.
 */
export function useQuoteCheckState({
  quote,
  plan,
  onCommit,
  onViewSource,
}: UseQuoteCheckStateOptions) {
  const [activeTierId, setActiveTierId] = useState<string>(quote.tiers[0]?.tierId || 'tier_default')
  const [activeAdderIds, setActiveAdderIds] = useState<string[]>(() =>
    (quote.omissionAdders || []).filter((a) => a.isEnabled).map((a) => a.id)
  )
  const [rawTextOpen, setRawTextOpen] = useState(false)
  const [highlightAnchor, setHighlightAnchor] = useState<string>('')
  const [isCommitting, setIsCommitting] = useState(false)

  const activeTier = quote.tiers.find((t) => t.tierId === activeTierId) ?? quote.tiers[0]

  // Tier total with the currently enabled adders.
  const activeAdders = (quote.omissionAdders || []).filter((a) => activeAdderIds.includes(a.id))
  const activeAddersTotalPaise = activeAdders.reduce((sum, a) => sum + a.amountPaise, 0)
  const currentTotalPaise = (activeTier?.baseTierPaise ?? 0) + activeAddersTotalPaise

  // Live plan displacement preview, only when a plan is provided.
  const displacementPreview = plan
    ? previewQuoteDisplacement(plan, quote, activeTier?.tierId ?? '', activeAdderIds)
    : null

  const toggleAdder = (adderId: string) => {
    setActiveAdderIds((prev) =>
      prev.includes(adderId) ? prev.filter((id) => id !== adderId) : [...prev, adderId]
    )
  }

  const openSourceDrawer = (anchor: string) => {
    setHighlightAnchor(anchor)
    setRawTextOpen(true)
    onViewSource?.(anchor)
  }

  const openRawText = () => {
    setHighlightAnchor('')
    setRawTextOpen(true)
  }

  const commit = () => {
    setIsCommitting(true)
    try {
      onCommit?.(activeTier.tierId, activeAdderIds)
    } finally {
      setIsCommitting(false)
    }
  }

  return {
    activeTierId,
    setActiveTierId,
    activeTier,
    activeAdderIds,
    toggleAdder,
    currentTotalPaise,
    displacementPreview,
    rawTextOpen,
    setRawTextOpen,
    highlightAnchor,
    openSourceDrawer,
    openRawText,
    isCommitting,
    commit,
  }
}
