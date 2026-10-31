import type { BudgetCategory, EventBrief, EventType, Plan } from '@/lib/engine/types'
import { parseINRInput } from '@/lib/engine/currency'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { clampToToday, rollForwardToFuture } from '@/lib/dates'
import { VIBE_MIN } from '@/lib/vibe-limits'
import type { VibeTradeoffs } from '../tradeoffGroups'

/** The default date moves forward a year at a time so it is never in the past. */
const DEFAULT_EVENT_DATE = '2026-11-20'

const FALLBACK_BUDGET_PAISE = 250_000_000

/** Picking an occasion pre-selects the budget line that matters most for it. */
const RECOMMENDED_PROTECTED_CATEGORY: Record<EventType, BudgetCategory> = {
  wedding: 'catering',
  birthday: 'photo_film',
  community: 'entertainment',
}

export interface BriefFormState {
  title: string
  eventType: EventType
  eventDate: string
  city: string
  guestCount: number
  rawBudgetInput: string
  protectedCategory: BudgetCategory
  nuances: string[]
  customNotes: string
  selectedSwatchIds: string[]
  protectedMoment: string
  tradeoffs: VibeTradeoffs
}

export type BasicsFields = Partial<
  Pick<BriefFormState, 'title' | 'eventType' | 'eventDate' | 'city'>
>
export type ScaleFields = Partial<
  Pick<BriefFormState, 'guestCount' | 'rawBudgetInput' | 'protectedCategory'>
>
export type NuanceFields = Partial<Pick<BriefFormState, 'nuances' | 'customNotes'>>

export type BriefFormAction =
  | { type: 'basics'; fields: BasicsFields }
  | { type: 'scale'; fields: ScaleFields }
  | { type: 'nuances'; fields: NuanceFields }
  | { type: 'swatches'; ids: string[] }
  | { type: 'protectedMoment'; value: string }
  | { type: 'tradeoffs'; value: VibeTradeoffs }

function defaultBriefForm(): BriefFormState {
  return {
    title: 'My Celebration',
    eventType: 'wedding',
    eventDate: rollForwardToFuture(DEFAULT_EVENT_DATE),
    city: 'Delhi',
    guestCount: 300,
    rawBudgetInput: '25L',
    protectedCategory: 'catering',
    nuances: [],
    customNotes: '',
    selectedSwatchIds: [],
    protectedMoment: '',
    tradeoffs: {
      feastVsSpectacle: 'feast',
      intimateVsGrand: 'intimate',
      heritageVsModern: 'heritage',
    },
  }
}

/** Starts from the defaults; anything the saved brief provides wins. */
export function createInitialBriefForm(initialBrief?: EventBrief): BriefFormState {
  const defaults = defaultBriefForm()
  if (!initialBrief) return defaults
  return applyDefined(defaults, {
    title: initialBrief.title,
    eventType: initialBrief.eventType,
    eventDate: initialBrief.eventDate,
    city: initialBrief.city,
    guestCount: initialBrief.guestCount,
    rawBudgetInput: `${Math.round(initialBrief.totalBudgetPaise / 100_000_00)}L`,
    protectedCategory: initialBrief.protectedCategory,
    nuances: initialBrief.nuances,
    customNotes: initialBrief.customNotes,
    selectedSwatchIds: initialBrief.vibeSwatches,
    protectedMoment: initialBrief.protectedMomentQuote,
    tradeoffs: initialBrief.tradeoffs,
  })
}

/** Copies over only the fields that were actually provided (not `undefined` or `null`). */
function applyDefined(state: BriefFormState, fields: Partial<BriefFormState>): BriefFormState {
  const next = { ...state }
  for (const key of Object.keys(fields) as (keyof BriefFormState)[]) {
    const value = fields[key]
    if (value !== undefined && value !== null) next[key] = value as never
  }
  return next
}

export function briefFormReducer(state: BriefFormState, action: BriefFormAction): BriefFormState {
  switch (action.type) {
    case 'basics': {
      const next = applyDefined(state, action.fields)
      if (action.fields.eventType !== undefined) {
        next.protectedCategory =
          RECOMMENDED_PROTECTED_CATEGORY[action.fields.eventType] ?? next.protectedCategory
      }
      return next
    }
    case 'scale':
    case 'nuances':
      return applyDefined(state, action.fields)
    case 'swatches':
      return { ...state, selectedSwatchIds: action.ids }
    case 'protectedMoment':
      return { ...state, protectedMoment: action.value }
    case 'tradeoffs':
      return { ...state, tradeoffs: action.value }
  }
}

function parseBudgetOrFallback(raw: string): number {
  try {
    return parseINRInput(raw)
  } catch {
    return FALLBACK_BUDGET_PAISE
  }
}

/**
 * Turns the form into a brief, applying the same defaults the wizard has always
 * used. Vibe fields are included when the user finished the vibe steps
 * (`withVibes`) or already picked enough swatches.
 */
export function buildBriefFromForm(form: BriefFormState, withVibes: boolean): EventBrief {
  const includeVibes = withVibes || form.selectedSwatchIds.length >= VIBE_MIN
  return {
    title: form.title.trim() || 'My Celebration',
    eventType: form.eventType,
    // Last line of defence: no plan is ever created for a day that has passed.
    eventDate: clampToToday(form.eventDate),
    city: form.city.trim() || 'Delhi',
    guestCount: form.guestCount || 100,
    totalBudgetPaise: parseBudgetOrFallback(form.rawBudgetInput),
    protectedCategory: form.protectedCategory,
    nuances: form.nuances,
    customNotes: form.customNotes,
    ...(includeVibes
      ? {
          vibeSwatches: form.selectedSwatchIds,
          protectedMomentQuote: form.protectedMoment.trim() || undefined,
          tradeoffs: form.tradeoffs,
        }
      : {}),
  }
}

/** Instantiates the plan; a finished vibe step always pins the protected moment. */
export function instantiatePlanFromForm(
  brief: EventBrief,
  withVibes: boolean,
  protectedMoment: string
): Plan {
  const plan = instantiatePlanFromBrief(brief)
  const moment = protectedMoment.trim()
  if (withVibes && moment) plan.brief.protectedMomentQuote = moment
  return plan
}
