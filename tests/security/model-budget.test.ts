import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getDailyModelCap,
  resetModelBudget,
  tryConsumeModelCall,
} from '@/lib/security/model-budget'

describe('daily model call cap (S3)', () => {
  beforeEach(() => {
    resetModelBudget()
    process.env.MODEL_DAILY_CAP = '3'
  })
  afterEach(() => {
    delete process.env.MODEL_DAILY_CAP
  })

  it('allows calls up to the cap and then refuses', () => {
    const results = Array.from({ length: 5 }, () => tryConsumeModelCall())
    expect(results).toEqual([true, true, true, false, false])
  })

  it('starts a fresh allowance on the next UTC day', () => {
    const day1 = new Date('2026-10-31T10:00:00Z')
    const day2 = new Date('2026-11-01T00:00:01Z')
    for (let i = 0; i < 3; i++) tryConsumeModelCall(day1)
    expect(tryConsumeModelCall(day1)).toBe(false)
    expect(tryConsumeModelCall(day2)).toBe(true)
  })

  it('a cap of 0 disables model calls entirely', () => {
    process.env.MODEL_DAILY_CAP = '0'
    expect(tryConsumeModelCall()).toBe(false)
  })

  it('falls back to the default for missing or invalid values', () => {
    delete process.env.MODEL_DAILY_CAP
    expect(getDailyModelCap()).toBe(300)
    process.env.MODEL_DAILY_CAP = 'lots'
    expect(getDailyModelCap()).toBe(300)
  })
})
