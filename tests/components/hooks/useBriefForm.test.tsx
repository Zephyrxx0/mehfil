import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  briefFormReducer,
  buildBriefFromForm,
  createInitialBriefForm,
  instantiatePlanFromForm,
} from '@/components/intake/hooks/briefForm'
import { useBriefForm } from '@/components/intake/hooks/useBriefForm'
import { STARTER_OPTIONS } from '@/components/intake/StarterChips'
import { todayISO } from '@/lib/dates'
import type { EventBrief } from '@/lib/engine/types'

const SAVED: EventBrief = {
  ...STARTER_OPTIONS[0].brief,
  eventDate: '2999-01-01',
  totalBudgetPaise: 400_000_00_00,
  nuances: ['Pure Veg / Jain Catering'],
  customNotes: 'Near the river',
  vibeSwatches: ['a', 'b', 'c'],
  protectedMomentQuote: 'The baraat',
  tradeoffs: {
    feastVsSpectacle: 'spectacle',
    intimateVsGrand: 'grand',
    heritageVsModern: 'modern',
  },
}

describe('createInitialBriefForm', () => {
  it('uses the wizard defaults when there is no saved brief', () => {
    const form = createInitialBriefForm()
    expect(form).toMatchObject({
      title: 'My Celebration',
      eventType: 'wedding',
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
    })
    expect(form.eventDate >= todayISO()).toBe(true)
  })

  it('lets a saved brief win over every default', () => {
    const form = createInitialBriefForm(SAVED)
    expect(form.title).toBe(SAVED.title)
    expect(form.eventDate).toBe('2999-01-01')
    expect(form.rawBudgetInput).toBe('400L')
    expect(form.nuances).toEqual(['Pure Veg / Jain Catering'])
    expect(form.customNotes).toBe('Near the river')
    expect(form.selectedSwatchIds).toEqual(['a', 'b', 'c'])
    expect(form.protectedMoment).toBe('The baraat')
    expect(form.tradeoffs.feastVsSpectacle).toBe('spectacle')
  })

  it('falls back to defaults for optional fields a saved brief omits', () => {
    const { nuances, customNotes, vibeSwatches, protectedMomentQuote, tradeoffs, ...bare } = SAVED
    void [nuances, customNotes, vibeSwatches, protectedMomentQuote, tradeoffs]
    const form = createInitialBriefForm(bare)
    expect(form.nuances).toEqual([])
    expect(form.selectedSwatchIds).toEqual([])
    expect(form.tradeoffs.heritageVsModern).toBe('heritage')
  })
})

describe('briefFormReducer', () => {
  const base = createInitialBriefForm()

  it('applies only the basics fields that are provided', () => {
    const next = briefFormReducer(base, { type: 'basics', fields: { city: 'Pune' } })
    expect(next).toEqual({ ...base, city: 'Pune' })
  })

  it.each([
    ['wedding', 'catering'],
    ['birthday', 'photo_film'],
    ['community', 'entertainment'],
  ] as const)('picking %s recommends %s as the protected category', (eventType, category) => {
    const next = briefFormReducer(base, { type: 'basics', fields: { eventType } })
    expect(next.eventType).toBe(eventType)
    expect(next.protectedCategory).toBe(category)
  })

  it('keeps a manual protected category until the occasion changes again', () => {
    const picked = briefFormReducer(base, {
      type: 'scale',
      fields: { protectedCategory: 'venue' },
    })
    const sameBasics = briefFormReducer(picked, { type: 'basics', fields: { title: 'Ours' } })
    expect(sameBasics.protectedCategory).toBe('venue')
  })

  it('updates scale, nuance, swatch, moment and tradeoff slices independently', () => {
    let s = briefFormReducer(base, {
      type: 'scale',
      fields: { guestCount: 80, rawBudgetInput: '9L' },
    })
    s = briefFormReducer(s, { type: 'nuances', fields: { customNotes: 'No onions' } })
    s = briefFormReducer(s, { type: 'swatches', ids: ['x'] })
    s = briefFormReducer(s, { type: 'protectedMoment', value: 'Vidaai' })
    s = briefFormReducer(s, { type: 'tradeoffs', value: SAVED.tradeoffs! })
    expect(s).toMatchObject({
      guestCount: 80,
      rawBudgetInput: '9L',
      customNotes: 'No onions',
      selectedSwatchIds: ['x'],
      protectedMoment: 'Vidaai',
      tradeoffs: SAVED.tradeoffs,
      title: base.title,
    })
  })
})

describe('buildBriefFromForm', () => {
  const form = createInitialBriefForm()

  it('omits vibe fields until the vibe step is finished or enough swatches are picked', () => {
    const brief = buildBriefFromForm(form, false)
    expect(brief).not.toHaveProperty('vibeSwatches')
    expect(brief).not.toHaveProperty('tradeoffs')
  })

  it('includes vibe fields when finishing the vibe step, trimming the moment', () => {
    const brief = buildBriefFromForm(
      { ...form, selectedSwatchIds: ['a'], protectedMoment: '  Pheras  ' },
      true
    )
    expect(brief.vibeSwatches).toEqual(['a'])
    expect(brief.protectedMomentQuote).toBe('Pheras')
    expect(brief.tradeoffs).toEqual(form.tradeoffs)
  })

  it('includes vibe fields when three or more swatches are already picked', () => {
    const brief = buildBriefFromForm({ ...form, selectedSwatchIds: ['a', 'b', 'c'] }, false)
    expect(brief.vibeSwatches).toEqual(['a', 'b', 'c'])
    expect(brief.protectedMomentQuote).toBeUndefined()
  })

  it('applies defaults for blank text, zero guests and unreadable budgets', () => {
    const brief = buildBriefFromForm(
      { ...form, title: '  ', city: '', guestCount: 0, rawBudgetInput: 'lots' },
      false
    )
    expect(brief.title).toBe('My Celebration')
    expect(brief.city).toBe('Delhi')
    expect(brief.guestCount).toBe(100)
    expect(brief.totalBudgetPaise).toBe(250_000_000)
  })

  it('never lets the event date be in the past', () => {
    expect(buildBriefFromForm({ ...form, eventDate: '2000-01-01' }, false).eventDate).toBe(
      todayISO()
    )
  })
})

describe('instantiatePlanFromForm', () => {
  // The plan keeps a reference to the brief it was built from, so use a fresh one each time.
  const freshBrief = () => buildBriefFromForm(createInitialBriefForm(), false)

  it('pins a trimmed protected moment when the vibe step was finished', () => {
    const plan = instantiatePlanFromForm(freshBrief(), true, '  Vidaai ')
    expect(plan.brief.protectedMomentQuote).toBe('Vidaai')
  })

  it('leaves the brief alone when the vibe step was skipped', () => {
    const plan = instantiatePlanFromForm(freshBrief(), false, 'Vidaai')
    expect(plan.brief.protectedMomentQuote).toBeUndefined()
  })
})

describe('useBriefForm', () => {
  it('exposes the form and stable actions that update it', () => {
    const { result } = renderHook(() => useBriefForm())
    const initialActions = result.current.actions

    act(() => result.current.actions.changeBasics({ title: 'Anniversary' }))
    act(() => result.current.actions.setSwatches(['a', 'b']))

    expect(result.current.form.title).toBe('Anniversary')
    expect(result.current.form.selectedSwatchIds).toEqual(['a', 'b'])
    expect(result.current.actions).toBe(initialActions)
  })
})
