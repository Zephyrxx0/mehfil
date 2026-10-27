import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  SWATCHES,
  SWATCH_PRESET_TAGS,
  getSwatchById,
  getSwatchesByTag,
  type SwatchPresetTag,
} from '@/data/swatches'

describe('Curated 24 Style Swatches Registry (ADR-0009, D-02, VIBE-01)', () => {
  it('contains exactly 24 curated swatches with unique IDs', () => {
    expect(SWATCHES).toHaveLength(24)
    const ids = SWATCHES.map((s) => s.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(24)
  })

  it('validates every swatch has non-empty title, description, and correct image/svg fallback paths', () => {
    for (const swatch of SWATCHES) {
      expect(swatch.title).toBeTruthy()
      expect(typeof swatch.title).toBe('string')
      expect(swatch.description).toBeTruthy()
      expect(typeof swatch.description).toBe('string')
      expect(swatch.image).toBe(`/swatches/${swatch.id}.webp`)
      expect(swatch.svgFallback).toBe(`/swatches/${swatch.id}.svg`)
    }
  })

  it('ensures every swatch has 3 or 4 valid 6-digit hex color strings', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    for (const swatch of SWATCHES) {
      expect(swatch.palette.length).toBeGreaterThanOrEqual(3)
      expect(swatch.palette.length).toBeLessThanOrEqual(4)
      for (const hex of swatch.palette) {
        expect(hex).toMatch(hexRegex)
      }
    }
  })

  it('ensures all 8 dimensions are integers strictly bounded in [0, 100]', () => {
    const requiredDimensions = [
      'formality',
      'energy',
      'scale',
      'heritageVsModern',
      'feastVsSpectacle',
      'music',
      'decorDensity',
      'indoorVsOutdoor',
    ] as const

    for (const swatch of SWATCHES) {
      for (const dim of requiredDimensions) {
        const val = swatch.dimensions[dim]
        expect(Number.isInteger(val)).toBe(true)
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(100)
      }
    }
  })

  it('verifies all swatches have at least 1 tag from the allowed preset tags', () => {
    for (const swatch of SWATCHES) {
      expect(swatch.tags.length).toBeGreaterThanOrEqual(1)
      expect(swatch.tags.length).toBeLessThanOrEqual(3)
      for (const tag of swatch.tags) {
        expect(SWATCH_PRESET_TAGS).toContain(tag)
      }
    }
  })

  it('verifies every SVG fallback file exists on disk and contains a valid <svg> XML root element', () => {
    for (const swatch of SWATCHES) {
      const filePath = path.resolve(process.cwd(), `public${swatch.svgFallback}`)
      expect(fs.existsSync(filePath), `Missing SVG fallback: ${filePath}`).toBe(true)

      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content.trim().startsWith('<svg')).toBe(true)
      expect(content.includes('</svg>')).toBe(true)
    }
  })

  it('looks up swatches by ID correctly', () => {
    const amber = getSwatchById('royal-amber-courtyard')
    expect(amber).toBeDefined()
    expect(amber?.title).toBe('Royal Amber Courtyard')

    const nonExistent = getSwatchById('non-existent-swatch')
    expect(nonExistent).toBeUndefined()
  })

  it('filters swatches by preset tag', () => {
    const royalHeritageSwatches = getSwatchesByTag('Royal Heritage')
    expect(royalHeritageSwatches.length).toBeGreaterThan(0)
    for (const swatch of royalHeritageSwatches) {
      expect(swatch.tags).toContain('Royal Heritage')
    }

    const melaSwatches = getSwatchesByTag('High Energy Mela')
    expect(melaSwatches.length).toBeGreaterThan(0)
    for (const swatch of melaSwatches) {
      expect(swatch.tags).toContain('High Energy Mela')
    }
  })
})
