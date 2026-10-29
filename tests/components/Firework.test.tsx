import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Firework } from '@/components/fireworks/Firework'
import { buildFirework, type FireworkType } from '@/components/fireworks/geometry'
import { HeroSection } from '@/components/hero/HeroSection'

const TYPES: FireworkType[] = ['peony', 'willow', 'ring', 'palm', 'chakri']

describe('firework geometry', () => {
  it.each(TYPES)('%s is valid, bounded and deterministic', (type) => {
    const a = buildFirework(type)
    expect(a).toEqual(buildFirework(type))
    expect(a.streaks.length + a.rings.length).toBeGreaterThan(0)
    for (const s of a.streaks) {
      expect(s.d.startsWith('M')).toBe(true)
      expect(s.d).not.toMatch(/NaN|Infinity/)
    }
    for (const s of a.sparks) {
      expect(Math.hypot(s.dx, s.dy + s.fall)).toBeLessThanOrEqual(70)
    }
    for (const t of a.twinkles) {
      expect(Math.hypot(t.x, t.y)).toBeLessThanOrEqual(50)
    }
  })

  it('gives each type a different look', () => {
    const sigs = TYPES.map((t) => {
      const s = buildFirework(t)
      return JSON.stringify([s.streaks.length, s.sparks.length, s.rings.length, s.twinkles.length, s.spin ?? 0])
    })
    expect(new Set(sigs).size).toBe(TYPES.length)
  })

  it('only the chakri spins and only the palm leaves embers', () => {
    expect(buildFirework('chakri').spin).toBeGreaterThan(0)
    expect(TYPES.filter((t) => buildFirework(t).spin).length).toBe(1)
    expect(TYPES.filter((t) => buildFirework(t).twinkles.length > 0)).toEqual(['palm'])
  })
})

describe('firework colour', () => {
  it.each(TYPES)('%s has soft blooms inside its box, in the page palette', (type) => {
    const { blooms } = buildFirework(type)
    expect(blooms.length).toBeGreaterThanOrEqual(2)
    for (const b of blooms) {
      expect(b.r).toBeGreaterThan(0)
      expect(b.r).toBeLessThanOrEqual(50)
      expect(b.opacity).toBeGreaterThan(0)
      expect(b.opacity).toBeLessThanOrEqual(0.5) // soft washes, not solid discs
      expect(['maroon', 'rose', 'marigold']).toContain(b.colour)
    }
  })

  it('draws the blooms before the lines so streaks and sparks stay crisp on top', () => {
    const { container } = render(<Firework type="peony" />)
    const blooms = container.querySelectorAll('.fw-bloom')
    expect(blooms.length).toBe(buildFirework('peony').blooms.length)
    const firstLine = container.querySelector('.fw-streak, .fw-ring')!
    blooms.forEach((b) => {
      expect(b).toHaveAttribute('fill-opacity')
      expect(b.compareDocumentPosition(firstLine) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
})

describe('Firework component', () => {
  it('is decorative and carries its timing as CSS variables', () => {
    const { container } = render(<Firework type="peony" seconds={5} offset={1} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('data-firework', 'peony')
    const streak = container.querySelector('.fw-streak') as SVGElement
    expect(streak.style.getPropertyValue('--fw-seconds')).toBe('5s')
    expect(streak.style.getPropertyValue('--fw-delay')).toBe('-1s')
    expect(streak).toHaveAttribute('pathLength', '1')
  })

  it('spins the chakri inside a rotating group', () => {
    const { container } = render(<Firework type="chakri" />)
    expect(container.querySelector('.fw-spin')).not.toBeNull()
  })
})

describe('landing page fireworks', () => {
  it('has five different fireworks in the marked areas', () => {
    const { container } = render(<HeroSection />)
    const types = [...container.querySelectorAll('[data-firework]')].map((n) => n.getAttribute('data-firework'))
    expect(types.sort()).toEqual(['chakri', 'palm', 'peony', 'ring', 'willow'])
  })
})
