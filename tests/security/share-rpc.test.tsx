// @vitest-environment node
import React from 'react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PGlite } from '@electric-sql/pglite'
import SharePage from '@/app/share/[token]/page'
import { CloudPlans } from '@/lib/storage/cloud-plans'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import { createMigratedDatabase, createPgliteRpcClient } from '../helpers/pglite'

let supabase: unknown = null
vi.mock('@/lib/supabase/server', () => ({ getServerSupabase: vi.fn(async () => supabase) }))

// Capture what the page hands to the view, so the test sees the sanitised plan itself.
const seen: { plan: Record<string, unknown> | null }[] = []
vi.mock('@/app/share/[token]/ShareClientView', () => ({
  ShareClientView: ({ sanitizedPlan }: { sanitizedPlan: Record<string, unknown> | null }) => {
    seen.push({ plan: sanitizedPlan })
    return <div data-testid="share-view">{sanitizedPlan ? 'plan' : 'expired'}</div>
  },
}))

const BRIEF = {
  title: 'Aarav & Diya Wedding',
  eventType: 'wedding' as const,
  eventDate: '2027-11-20',
  city: 'Jaipur',
  guestCount: 250,
  totalBudgetPaise: 250_000_000,
  protectedCategory: 'catering' as const,
}

let db: PGlite
let cloud: CloudPlans
beforeAll(async () => {
  db = await createMigratedDatabase()
  const client = createPgliteRpcClient(db)
  cloud = new CloudPlans(client)
  supabase = client
}, 60_000)
afterAll(async () => {
  await db.close()
})
beforeEach(() => {
  seen.length = 0
})

async function open(token: string) {
  const element = await SharePage({ params: Promise.resolve({ token }) })
  return renderToStaticMarkup(element)
}

describe('family share page against the real database (S1)', () => {
  it('opens a plan with the share token returned at creation', async () => {
    const created = await cloud.createEvent(instantiatePlanFromBrief(BRIEF), 'Initial plan')
    const html = await open(created.shareKey)

    expect(html).toContain('plan')
    const plan = seen[0].plan as { title: string; city: string }
    expect(plan.title).toBe('Aarav & Diya Wedding')
    expect(plan.city).toBe('Jaipur')
  })

  it('never reveals secrets, vendor notes or the edit key to the family view', async () => {
    const created = await cloud.createEvent(instantiatePlanFromBrief(BRIEF), 'Initial plan')
    await open(created.shareKey)
    const serialised = JSON.stringify(seen[0].plan)
    expect(serialised).not.toContain(created.editKey)
    expect(serialised).not.toContain('edit_key_hash')
    expect(serialised).not.toContain('share_key_hash')
  })

  it('shows the expired view for unknown tokens, the edit key, and malformed tokens', async () => {
    const created = await cloud.createEvent(instantiatePlanFromBrief(BRIEF), 'Initial plan')
    for (const token of ['f'.repeat(64), created.editKey, 'short', '<script>']) {
      expect(await open(token)).toContain('expired')
    }
  })

  it('stops working the moment the organizer replaces the link', async () => {
    const created = await cloud.createEvent(instantiatePlanFromBrief(BRIEF), 'Initial plan')
    expect(await open(created.shareKey)).toContain('plan')

    const fresh = await cloud.regenerateShareKey(created.eventId, created.editKey)
    expect(await open(created.shareKey)).toContain('expired')
    expect(await open(fresh!)).toContain('plan')
  })

  it('falls back to the expired view when no database is configured', async () => {
    const previous = supabase
    supabase = null
    try {
      expect(await open('a'.repeat(64))).toContain('expired')
    } finally {
      supabase = previous
    }
  })
})
