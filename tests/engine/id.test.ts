import { describe, expect, it } from 'vitest'
import { createId } from '@/lib/id'

describe('createId', () => {
  it('prefixes a v4 UUID', () => {
    expect(createId('quote')).toMatch(
      /^quote-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('does not collide across many calls', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => createId('x')))
    expect(ids.size).toBe(5000)
  })
})
