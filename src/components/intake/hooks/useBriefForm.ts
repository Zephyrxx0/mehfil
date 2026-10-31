import { useMemo, useReducer } from 'react'
import type { EventBrief } from '@/lib/engine/types'
import type { VibeTradeoffs } from '../tradeoffGroups'
import {
  briefFormReducer,
  createInitialBriefForm,
  type BasicsFields,
  type NuanceFields,
  type ScaleFields,
} from './briefForm'

/** Owns every field the wizard collects; one reducer instead of a dozen setters. */
export function useBriefForm(initialBrief?: EventBrief) {
  const [form, dispatch] = useReducer(briefFormReducer, initialBrief, createInitialBriefForm)

  const actions = useMemo(
    () => ({
      changeBasics: (fields: BasicsFields) => dispatch({ type: 'basics', fields }),
      changeScale: (fields: ScaleFields) => dispatch({ type: 'scale', fields }),
      changeNuances: (fields: NuanceFields) => dispatch({ type: 'nuances', fields }),
      setSwatches: (ids: string[]) => dispatch({ type: 'swatches', ids }),
      setProtectedMoment: (value: string) => dispatch({ type: 'protectedMoment', value }),
      setTradeoffs: (value: VibeTradeoffs) => dispatch({ type: 'tradeoffs', value }),
    }),
    []
  )

  return { form, actions }
}

export type BriefFormActions = ReturnType<typeof useBriefForm>['actions']
