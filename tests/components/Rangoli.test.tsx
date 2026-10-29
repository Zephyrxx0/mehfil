import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Rangoli } from '@/components/rangoli/Rangoli'
import { buildMandala } from '@/components/rangoli/geometry'
import { HeroSection } from '@/components/hero/HeroSection'

describe('mandala geometry', () => {
  const groups = buildMandala()

  it('has an inner, a middle and an outer group turning in alternating directions', () => {
    expect(groups.map((g) => g.id)).toEqual(['heart', 'lotus', 'border'])
    expect(groups.map((g) => g.reverse)).toEqual([true, false, true])
    expect(new Set(groups.map((g) => g.spin)).size).toBe(3)
  })

  it('has valid paths everywhere', () => {
    for (const g of groups) {
      expect(g.base.length).toBeGreaterThan(0)
      for (const d of [...g.base, ...g.traces.map((t) => t.d)]) {
        expect(d.startsWith('M')).toBe(true)
        expect(d).not.toMatch(/NaN|Infinity/)
      }
      for (const ring of g.dots) {
        expect(ring.points.length).toBeGreaterThan(0)
        ring.points.forEach(([x, y]) => {
          expect(Math.hypot(x, y)).toBeLessThanOrEqual(100)
        })
      }
    }
  })

  it('stays inside the 200 x 200 box', () => {
    for (const g of groups) {
      for (const ring of g.dots) {
        for (const [x, y] of ring.points) {
          expect(Math.abs(x)).toBeLessThanOrEqual(100)
          expect(Math.abs(y)).toBeLessThanOrEqual(100)
        }
      }
    }
  })

  it('animates different areas at different speeds and offsets', () => {
    const traces = groups.flatMap((g) => g.traces)
    expect(traces.length).toBeGreaterThanOrEqual(4)
    expect(new Set(traces.map((t) => t.seconds)).size).toBe(traces.length)
    expect(new Set(traces.map((t) => t.offset)).size).toBe(traces.length)
    expect(new Set(traces.map((t) => t.colour)).size).toBeGreaterThanOrEqual(3)
  })

  it('colours every group with washes of the three palette colours, using valid paths', () => {
    for (const g of groups) {
      expect(g.fills.length).toBeGreaterThan(0)
      for (const f of g.fills) {
        expect(f.d.startsWith('M')).toBe(true)
        expect(f.d).not.toMatch(/NaN|Infinity/)
        expect(f.opacity).toBeGreaterThan(0)
        expect(f.opacity).toBeLessThanOrEqual(1)
      }
    }
    const colours = new Set(groups.flatMap((g) => g.fills.map((f) => f.colour)))
    expect(colours).toEqual(new Set(['maroon', 'rose', 'marigold']))
  })

  it('is deterministic, so server and client render the same markup', () => {
    expect(buildMandala()).toEqual(buildMandala())
  })
})

describe('Rangoli component', () => {
  it('renders three rotating groups, traced rings and pulsing dots, decoratively', () => {
    const { container } = render(<Rangoli />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.rangoli-group')).toHaveLength(3)

    const traces = container.querySelectorAll('.rangoli-trace')
    expect(traces.length).toBeGreaterThanOrEqual(4)
    traces.forEach((t) => expect(t).toHaveAttribute('pathLength', '1'))

    const dots = container.querySelectorAll('.rangoli-dot')
    expect(dots.length).toBeGreaterThan(50)
    const delays = new Set([...dots].map((d) => (d as SVGElement).style.getPropertyValue('--rangoli-delay')))
    expect(delays.size).toBeGreaterThan(10)
  })
})

describe('Rangoli fills', () => {
  it('paints the colour under the thin lines, with the even-odd rule so rings can leave holes', () => {
    const { container } = render(<Rangoli />)
    const groups = container.querySelectorAll('.rangoli-group')
    groups.forEach((group) => {
      const fills = group.querySelector('[data-rangoli-fills]')!
      const lines = group.querySelector('g[stroke]:not([data-rangoli-fills])')!
      // Fills come first in the DOM, so the lines are drawn on top of them.
      expect(fills.compareDocumentPosition(lines) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      fills.querySelectorAll('path').forEach((p) => {
        expect(p).toHaveAttribute('fill-rule', 'evenodd')
        expect(p.getAttribute('fill')).toMatch(/^hsl\(/)
        expect(Number(p.getAttribute('fill-opacity'))).toBeGreaterThan(0)
      })
    })
  })
})

describe('landing page rangoli', () => {
  it('has exactly one rangoli, the mandala behind the title', () => {
    const { container } = render(<HeroSection />)
    const all = container.querySelectorAll('[data-rangoli]')
    expect(all).toHaveLength(1)
    expect(all[0].getAttribute('data-rangoli')).toBe('mandala')
  })
})
