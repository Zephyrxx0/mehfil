// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { CloudPlans } from '@/lib/storage/cloud-plans'
import { createMigratedDatabase, createPgliteRpcClient } from '../helpers/pglite'

// Published in the seed's header comments, so they are the documented development tokens.
const SEED_EVENT_ID = '11111111-1111-1111-1111-111111111111'
const SEED_EDIT_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
const SEED_SHARE_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'

let db: PGlite
let cloud: CloudPlans
beforeAll(async () => {
  db = await createMigratedDatabase()
  await db.exec(readFileSync(join(process.cwd(), 'supabase', 'seed.sql'), 'utf8'))
  cloud = new CloudPlans(createPgliteRpcClient(db))
}, 60_000)
afterAll(async () => {
  await db.close()
})

describe('supabase/seed.sql works with the token-checked functions', () => {
  it('opens for the documented edit key, decoding into a valid plan', async () => {
    const found = await cloud.getEditablePlan(SEED_EVENT_ID, SEED_EDIT_KEY)
    expect(found?.plan.brief.city).toBe('Chennai')
    expect(found?.plan.lines).toHaveLength(8)
    const total = found!.plan.lines.reduce((sum, line) => sum + line.currentPaise, 0)
    expect(total).toBe(found!.plan.totalBudgetPaise)
  })

  it('opens the family view for the documented share token', async () => {
    const shared = await cloud.getSharedPlan(SEED_SHARE_KEY)
    expect(shared?.brief.title).toBe('Kavya & Siddharth Wedding')
  })

  it('warns in its first line that it must never run in production', () => {
    const firstLine = readFileSync(join(process.cwd(), 'supabase', 'seed.sql'), 'utf8').split(
      '\n'
    )[0]
    expect(firstLine).toMatch(/NEVER RUN THIS AGAINST A PRODUCTION DATABASE/)
  })
})
