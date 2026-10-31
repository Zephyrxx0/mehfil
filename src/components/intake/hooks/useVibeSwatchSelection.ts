import { useMemo, useState } from 'react'
import { SWATCHES, type SwatchPresetTag } from '@/data/swatches'
import { VIBE_MAX } from '@/lib/vibe-limits'
import type { VibeSuggestionResult } from '../DescribeVibeDialog'

/** How long the count badge shakes after a pick is refused. */
const SHAKE_MS = 200

interface AssistantNote {
  text: string
  previous: string[]
}

/**
 * Everything the gallery does with the user's picks: category filter, which
 * reference is in focus, the pick cap (with its warning and shake), and
 * applying / undoing a suggestion from the "Describe your vibe" assistant.
 */
export function useVibeSwatchSelection(
  selectedSwatchIds: string[],
  onChange: (ids: string[]) => void
) {
  const [categories, setCategories] = useState<SwatchPresetTag[]>([])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [assistantNote, setAssistantNote] = useState<AssistantNote | null>(null)

  const filtered = useMemo(
    () =>
      categories.length === 0
        ? SWATCHES
        : SWATCHES.filter((s) => s.tags.some((tag) => categories.includes(tag))),
    [categories]
  )

  // The focused swatch, or the first in the list if it has been filtered away.
  const focused = filtered.find((s) => s.id === focusedId) ?? filtered[0]

  const toggle = (id: string) => {
    if (selectedSwatchIds.includes(id)) {
      onChange(selectedSwatchIds.filter((item) => item !== id))
      setWarningMessage(null)
      return
    }
    if (selectedSwatchIds.length >= VIBE_MAX) {
      setShake(true)
      setWarningMessage(`Maximum ${VIBE_MAX} swatches reached. Tap a selected swatch to deselect.`)
      setTimeout(() => setShake(false), SHAKE_MS)
      return
    }
    setWarningMessage(null)
    onChange([...selectedSwatchIds, id])
  }

  const applySuggestion = (result: VibeSuggestionResult) => {
    const ids = result.swatchIds
      .filter((id) => SWATCHES.some((s) => s.id === id))
      .slice(0, VIBE_MAX)
    if (ids.length === 0) return
    setAssistantNote({
      text: `${result.source === 'ai' ? 'Picked for you' : 'Matched for you'}: ${result.reasoning}`,
      previous: selectedSwatchIds,
    })
    setCategories([])
    setFocusedId(ids[0])
    setWarningMessage(null)
    onChange(ids)
  }

  const undoSuggestion = () => {
    if (!assistantNote) return
    onChange(assistantNote.previous)
    setAssistantNote(null)
  }

  return {
    categories,
    setCategories,
    filtered,
    focused,
    setFocusedId,
    shake,
    warningMessage,
    assistantNote,
    toggle,
    applySuggestion,
    undoSuggestion,
  }
}
