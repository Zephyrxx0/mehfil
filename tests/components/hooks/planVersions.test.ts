import { describe, expect, it } from 'vitest'
import {
  burstStartOf,
  conflictFrom,
  headOf,
  initialVersionList,
  savedHead,
  summarizeBurst,
  versionRecordFor,
  withNewVersion,
  type PendingCommit,
} from '@/components/workspace/hooks/planVersions'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { rebalanceGuestCount } from '@/lib/engine/budget'
import type { EventBrief, PlanVersionRecord } from '@/lib/engine/types'

const BRIEF: EventBrief = {
  title: 'Pure versions',
  eventType: 'wedding',
  eventDate: '2027-09-09',
  city: 'Delhi',
  guestCount: 200,
  totalBudgetPaise: 200_000_000,
  protectedCategory: 'catering',
}
const base = instantiatePlanFromBrief(BRIEF)

const record = (n: number, id = `v${n}`): PlanVersionRecord => ({
  id,
  eventId: base.id,
  versionNumber: n,
  reason: `r${n}`,
  isFloorProtected: false,
  snapshot: base,
  createdAt: '2027-01-01T00:00:00.000Z',
})

describe('planVersions: history', () => {
  it('uses the given versions, else a placeholder first version', () => {
    const given = [record(3)]
    expect(initialVersionList(base, given)).toBe(given)
    const [first] = initialVersionList(base, [])
    expect(first).toMatchObject({ id: `ver-${base.id}-1`, versionNumber: 1, eventId: base.id })
  })

  it('takes the head from the highest version number, not list order', () => {
    expect(headOf([record(2), record(5), record(3)])).toEqual({ id: 'v5', number: 5 })
  })

  it('puts a new record first and replaces an older one with the same number', () => {
    const next = record(2, 'fresh')
    const list = withNewVersion([record(2), record(1)], next)
    expect(list.map((v) => v.id)).toEqual(['fresh', 'v1'])
  })
})

describe('planVersions: saves', () => {
  it('uses the version storage answered with', () => {
    expect(
      savedHead({ status: 'saved_cloud', versionId: 'abc', versionNumber: 7 }, base, {
        id: 'old',
        number: 3,
      })
    ).toEqual({ id: 'abc', number: 7 })
  })

  it('works out the next number and id only when storage gave none', () => {
    expect(savedHead({ status: 'saved_local' }, base, { id: 'old', number: 3 })).toEqual({
      id: `ver-${base.id}-4`,
      number: 4,
    })
  })

  it('builds the saved record with its parent and floor flag', () => {
    const rec = versionRecordFor({
      plan: base,
      reason: 'why',
      head: { id: 'n', number: 2 },
      parentId: 'p',
      createdAt: 'now',
    })
    expect(rec).toMatchObject({
      id: 'n',
      versionNumber: 2,
      parentVersionId: 'p',
      reason: 'why',
      isFloorProtected: true,
      createdAt: 'now',
    })
  })
})

describe('planVersions: conflicts', () => {
  const other = rebalanceGuestCount(base, 220)

  it('carries the winning plan and head', () => {
    expect(
      conflictFrom(
        { status: 'conflict', conflictPlan: other, versionId: 'w', versionNumber: 9 },
        base
      )
    ).toEqual({ plan: other, head: { id: 'w', number: 9 } })
  })

  it('falls back to the attempted plan, with no head when storage gave none', () => {
    expect(conflictFrom({ status: 'conflict' }, base)).toEqual({ plan: base, head: null })
  })
})

describe('planVersions: bursts', () => {
  const pending = (burstStart = base): PendingCommit => ({
    timer: 0 as unknown as ReturnType<typeof setTimeout>,
    next: rebalanceGuestCount(base, 230),
    burstStart,
    actionType: 'guest_scale',
  })

  it('keeps the start of a burst already under way', () => {
    const other = rebalanceGuestCount(base, 150)
    expect(burstStartOf(pending(base), other)).toBe(base)
    expect(burstStartOf(null, other)).toBe(other)
  })

  it('summarises from the start of the burst to its last edit', () => {
    expect(summarizeBurst(pending())).toEqual(expect.any(String))
    expect(summarizeBurst(pending()).length).toBeGreaterThan(0)
  })
})
