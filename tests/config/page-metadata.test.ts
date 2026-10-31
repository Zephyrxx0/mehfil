import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getServerRpc: () => null }))
// These tests only read exported metadata. Stubbing the heavy client trees the layout and the
// share page import keeps the suite fast, so it cannot time out when the whole run is busy.
vi.mock('@/app/plan/[id]/PlanClientPage', () => ({ PlanClientPage: () => null }))
vi.mock('@/app/share/[token]/ShareClientView', () => ({ ShareClientView: () => null }))
// next/font is a build-time transform; outside the build it is only a stub.
vi.mock('next/font/local', () => ({ default: () => ({ variable: '' }) }))

describe('private page metadata', () => {
  it('gives the plan pages a fixed title and keeps them out of search indexes', async () => {
    const { metadata } = await import('@/app/plan/[id]/layout')

    expect(metadata.title).toEqual({ absolute: 'Your celebration plan — Mehfil' })
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('gives the family share page a fixed title and keeps it out of search indexes', async () => {
    const { metadata } = await import('@/app/share/[token]/page')

    expect(metadata.title).toEqual({ absolute: 'Family view — Mehfil' })
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('never reads the plan or the token to build a title', async () => {
    const plan = await import('@/app/plan/[id]/layout')
    const share = await import('@/app/share/[token]/page')

    // A static object cannot depend on the request; a generateMetadata function could.
    expect(plan).not.toHaveProperty('generateMetadata')
    expect(share).not.toHaveProperty('generateMetadata')
    expect(typeof plan.metadata).toBe('object')
    expect(typeof share.metadata).toBe('object')
  })

  it('keeps the root title default and template', async () => {
    const { metadata } = await import('@/app/layout')

    expect(metadata.title).toEqual({
      default: 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity',
      template: '%s | Mehfil (महफ़िल)',
    })
  })
})
