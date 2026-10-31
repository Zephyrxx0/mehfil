import { describe, expect, it, vi } from 'vitest'

// These tests only read exported metadata; the page body and its UI imports are not rendered.
vi.mock('next/link', () => ({ default: () => null }))
vi.mock('@/components/ui/button', () => ({ Button: () => null }))
// next/font is a build-time transform; outside the build it is only a stub.
vi.mock('next/font/local', () => ({ default: () => ({ variable: '' }) }))

describe('not-found page metadata', () => {
  it('gives unknown routes their own title instead of the generic site title', async () => {
    const { metadata } = await import('@/app/not-found')

    expect(metadata.title).toBe('Page not found')
  })

  it('is a plain string, so the root title template appends the site name', async () => {
    const { metadata } = await import('@/app/not-found')
    const { metadata: root } = await import('@/app/layout')

    expect(typeof metadata.title).toBe('string')
    expect(root.title).toMatchObject({ template: '%s | Mehfil (महफ़िल)' })
  })
})
