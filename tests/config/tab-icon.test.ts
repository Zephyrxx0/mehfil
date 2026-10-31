// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderTabIcon } from '../../scripts/build-app-icons.ts'

const committed = () => readFileSync(join(process.cwd(), 'src', 'app', 'icon.svg'), 'utf8')

describe('tab icon', () => {
  it('is the landing rangoli: the committed file matches the generator', () => {
    // If this fails, run: node --experimental-strip-types scripts/build-app-icons.ts
    expect(committed()).toBe(renderTabIcon())
  })

  it('is a square, ivory-backed SVG that Next serves as the tab icon', () => {
    const svg = committed()
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="-100 -100 200 200"')
    expect(svg).toContain('fill="#FFF8EE"')
  })

  it('uses only the landing palette, with no animation or external references', () => {
    const svg = committed()
    expect(svg).not.toMatch(/<style|<script|href=|xlink:|class=|@keyframes/)
    // maroon line art, rose and marigold washes, ivory ground: the values the landing page renders
    expect([...new Set(svg.match(/#[0-9A-F]{6}/g))].sort()).toEqual(
      ['#671829', '#D65170', '#F4AD2A', '#FFF8EE'].sort()
    )
  })
})
