import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Plan, ShortfallRemedy } from '@/lib/engine/types'
import {
  activeShortfallPaise,
  categoryAnchorId,
  categoryDisplayName,
  elasticFloorPaise,
  FLOOR_PERCENT_LABEL,
  FLOOR_RATIO,
  pulseHaptic,
  remedyButtonLabel,
  scrollToCategory,
} from '@/components/workspace/plan-status'
import {
  baselineDeltaText,
  committedVarianceText,
  deriveBudgetLineView,
  signedAmountClass,
} from '@/components/workspace/budget-line-view'
import { resolveChangeList, resolveCurrentVersion } from '@/components/workspace/workspace-history'
import type { BudgetLine, PlanVersionRecord } from '@/lib/engine/types'

const asPlan = (partial: Partial<Plan>) => partial as Plan

describe('plan-status: category anchors', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('builds the DOM id BudgetLineRow sets and MilestoneBand scrolls to', () => {
    expect(categoryAnchorId('photo_film')).toBe('category-photo_film')
  })

  it('scrolls the matching row into view', () => {
    const row = document.createElement('li')
    row.id = categoryAnchorId('decor')
    row.scrollIntoView = vi.fn()
    document.body.appendChild(row)

    scrollToCategory('decor')

    expect(row.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('does nothing when the row is not on screen', () => {
    expect(() => scrollToCategory('venue')).not.toThrow()
  })

  it('names known categories and falls back to the raw key', () => {
    expect(categoryDisplayName('venue')).toBe('Venue & Stage')
    expect(categoryDisplayName('photo_film')).toBe('Photography & Film')
    expect(categoryDisplayName('contingency')).toBe('Contingency Cash')
    expect(categoryDisplayName('mystery')).toBe('mystery')
  })
})

describe('plan-status: flexible-line floor', () => {
  it('uses a 40% floor, shown as "40%"', () => {
    expect(FLOOR_RATIO).toBe(0.4)
    expect(FLOOR_PERCENT_LABEL).toBe('40%')
  })

  it('rounds the floor to a whole rupee', () => {
    expect(elasticFloorPaise(500_000_00)).toBe(200_000_00)
    // 0.4 * 12_345_67 = 493827.2 paise, rounds to 4938 rupees
    expect(elasticFloorPaise(12_345_67)).toBe(493_800)
    expect(elasticFloorPaise(0)).toBe(0)
  })
})

describe('plan-status: shortfall', () => {
  it('reports the shortfall only for an infeasible plan with a positive amount', () => {
    expect(activeShortfallPaise(asPlan({ isInfeasible: true, shortfallPaise: 5_000_00 }))).toBe(
      5_000_00
    )
    expect(activeShortfallPaise(asPlan({ isInfeasible: false, shortfallPaise: 5_000_00 }))).toBe(
      undefined
    )
    expect(activeShortfallPaise(asPlan({ isInfeasible: true, shortfallPaise: 0 }))).toBe(undefined)
    expect(activeShortfallPaise(asPlan({ isInfeasible: true }))).toBe(undefined)
  })

  it('labels each remedy button', () => {
    const remedy = (type: string, deltaValue: number) =>
      ({ type, deltaValue, title: '', description: '' }) as unknown as ShortfallRemedy
    expect(remedyButtonLabel(remedy('increase_budget', 1_00_000_00))).toBe(
      'Add ₹1,00,000 to Budget'
    )
    expect(remedyButtonLabel(remedy('reduce_guests', 120))).toBe('Set Guests to 120')
    expect(remedyButtonLabel(remedy('trim_elastic', 0))).toBe('Trim Flexible Lines')
    expect(remedyButtonLabel(remedy('other', 0))).toBe('Apply Remedy')
  })
})

describe('plan-status: pulseHaptic', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'vibrate')

  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'vibrate', original)
    else Reflect.deleteProperty(navigator, 'vibrate')
  })

  it('vibrates for 50ms when supported', () => {
    const vibrate = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    pulseHaptic()
    expect(vibrate).toHaveBeenCalledWith(50)
  })

  it('swallows errors from restricted contexts', () => {
    const vibrate = vi.fn(() => {
      throw new Error('blocked')
    })
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    expect(() => pulseHaptic()).not.toThrow()
  })

  it('does nothing when vibrate is unavailable', () => {
    Reflect.deleteProperty(navigator, 'vibrate')
    expect(() => pulseHaptic()).not.toThrow()
  })
})

describe('budget-line-view', () => {
  const line = {
    id: 'l1',
    category: 'decor',
    name: 'Decor',
    baselinePaise: 500_000_00,
    currentPaise: 450_000_00,
    lineType: 'flexible',
    isProtected: false,
  } as BudgetLine

  it('derives share, clamped share, delta and floor', () => {
    const view = deriveBudgetLineView(line, 2_000_000_00)
    expect(view.rawPercentage).toBeCloseTo(22.5)
    expect(view.percentageClamped).toBeCloseTo(22.5)
    expect(view.delta).toBe(-50_000_00)
    expect(view.floorAmount).toBe(200_000_00)
  })

  it('clamps the bar and tolerates a zero budget', () => {
    expect(deriveBudgetLineView(line, 100_000_00).percentageClamped).toBe(100)
    const zero = deriveBudgetLineView(line, 0)
    expect(zero.rawPercentage).toBe(0)
    expect(zero.percentageClamped).toBe(0)
  })

  it('words variance and delta text', () => {
    expect(committedVarianceText(10_000_00)).toBe('Saved ₹10,000')
    expect(committedVarianceText(-10_000_00)).toBe('+₹10,000 actual')
    expect(committedVarianceText(0)).toBe('Exact to allocation')
    expect(baselineDeltaText(5_000_00)).toBe('+₹5,000')
    expect(baselineDeltaText(-5_000_00)).toBe('-₹5,000')
  })

  it('colours signed amounts', () => {
    expect(signedAmountClass(1)).toBe('text-[#2E5A44]')
    expect(signedAmountClass(-1)).toBe('text-terracotta')
    expect(signedAmountClass(0)).toBe('')
  })
})

describe('workspace-history', () => {
  const v = (n: number) => ({ versionNumber: n }) as PlanVersionRecord

  it('prefers changes, then history, then an empty list', () => {
    const a = [{ id: 'a' }] as never
    const b = [{ id: 'b' }] as never
    expect(resolveChangeList(a, b)).toBe(a)
    expect(resolveChangeList(undefined, b)).toBe(b)
    expect(resolveChangeList()).toEqual([])
  })

  it('prefers the given version, then the numbered one, then the first', () => {
    const versions = [v(3), v(2), v(1)]
    expect(resolveCurrentVersion(versions, v(9), 2)).toEqual(v(9))
    expect(resolveCurrentVersion(versions, undefined, 2)).toBe(versions[1])
    expect(resolveCurrentVersion(versions, undefined, 42)).toBe(versions[0])
    expect(resolveCurrentVersion(undefined, undefined, 1)).toBeUndefined()
  })
})
