import { describe, it, expect, beforeEach } from 'vitest'
import { persistence, saveNewPlan } from '@/lib/storage/persistence'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { STARTER_OPTIONS } from '@/components/intake/StarterChips'
import { PLAN_TABS, isPlanTab } from '@/components/workspace/tabs'

describe('saveNewPlan', () => {
  beforeEach(() => window.localStorage.clear())

  it('stores a freshly created plan so it reopens editable in the same browser', async () => {
    const plan = instantiatePlanFromBrief(STARTER_OPTIONS[0].brief)
    await saveNewPlan(plan)

    const opened = await persistence.getPlan(plan.id)
    expect(opened?.plan.id).toBe(plan.id)
    expect(opened?.isReadOnly).toBe(false)

    const history = await persistence.getVersionHistory(plan.id)
    expect(history).toHaveLength(1)
  })

  it('keeps plans that were not created here read-only', async () => {
    const plan = instantiatePlanFromBrief(STARTER_OPTIONS[1].brief)
    window.localStorage.setItem(`mehfil_plan_${plan.id}`, JSON.stringify(plan))

    const opened = await persistence.getPlan(plan.id)
    expect(opened?.isReadOnly).toBe(true)
  })
})

describe('workspace routes', () => {
  it('knows the five tab routes and rejects others', () => {
    expect(PLAN_TABS.map((t) => t.id)).toEqual(['budget', 'timeline', 'ideas', 'style', 'history'])
    expect(isPlanTab('timeline')).toBe(true)
    expect(isPlanTab('summary')).toBe(false)
    expect(isPlanTab(null)).toBe(false)
  })

  it('gives every starter a stable key for /new?starter=', () => {
    expect(STARTER_OPTIONS.map((s) => s.key)).toEqual(['wedding', 'birthday', 'community'])
  })
})
