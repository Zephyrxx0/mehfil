import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Helper: Calculate relative luminance according to WCAG 2.1
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const transform = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

  const rLin = transform(r)
  const gLin = transform(g)
  const bLin = transform(b)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

// Helper: Calculate contrast ratio between two hex colors
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1)
  const lum2 = getLuminance(hex2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('Mehfil Design Tokens & Contrast Ratios', () => {
  const ROYAL_PLUM = '#3A2442'
  const WARM_IVORY = '#FFF8EE'
  const MARIGOLD = '#F7C873'
  const GULABI_ROSE = '#F2A7B8'
  const WHITE = '#FFFFFF'

  describe('WCAG AAA Compliance for Royal Plum Ink', () => {
    it('verifies Royal Plum on Warm Ivory exceeds 13:1 contrast ratio', () => {
      const ratio = getContrastRatio(ROYAL_PLUM, WARM_IVORY)
      expect(ratio).toBeGreaterThanOrEqual(13.0)
    })

    it('verifies Royal Plum on Marigold exceeds 8.5:1 contrast ratio', () => {
      const ratio = getContrastRatio(ROYAL_PLUM, MARIGOLD)
      expect(ratio).toBeGreaterThanOrEqual(8.5)
    })

    it('verifies Royal Plum on Gulabi Rose exceeds 7.0:1 contrast ratio (WCAG AAA)', () => {
      const ratio = getContrastRatio(ROYAL_PLUM, GULABI_ROSE)
      expect(ratio).toBeGreaterThanOrEqual(7.0)
    })
  })

  describe('Anti-Pattern Banned Combinations', () => {
    it('demonstrates that White text on Marigold fails WCAG minimums (< 2:1)', () => {
      const ratio = getContrastRatio(WHITE, MARIGOLD)
      expect(ratio).toBeLessThan(2.0)
    })

    it('demonstrates that White text on Gulabi Rose fails WCAG minimums (< 2:1)', () => {
      const ratio = getContrastRatio(WHITE, GULABI_ROSE)
      expect(ratio).toBeLessThan(2.0)
    })
  })

  describe('Static Source Code Scanning for Banned Pastels + White Text', () => {
    function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          getAllSourceFiles(fullPath, fileList)
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          fileList.push(fullPath)
        }
      }
      return fileList
    }

    it('ensures no component in src/ uses text-white or white ink on pastel backgrounds', () => {
      const srcDir = path.resolve(__dirname, '../../src')
      const sourceFiles = getAllSourceFiles(srcDir)

      const violations: string[] = []

      // Banned patterns:
      // - Class containing text-white together with bg-marigold, bg-gulabi-rose, or bg-warm-ivory
      // - Inline style with color: white/#fff and pastel background
      const pastelRegexes = [
        /bg-marigold[^'"`}]*text-white/,
        /text-white[^'"`}]*bg-marigold/,
        /bg-gulabi-rose[^'"`}]*text-white/,
        /text-white[^'"`}]*bg-gulabi-rose/,
        /bg-warm-ivory[^'"`}]*text-white/,
        /text-white[^'"`}]*bg-warm-ivory/,
      ]

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        for (const regex of pastelRegexes) {
          if (regex.test(content)) {
            violations.push(`${file} matches banned pattern ${regex.source}`)
          }
        }
      }

      expect(violations).toEqual([])
    })
  })

  describe('Global CSS & Font Configuration Tokens', () => {
    it('verifies globals.css defines radius 1.25rem and 3-hue HSL tokens', () => {
      const globalsCss = fs.readFileSync(
        path.resolve(__dirname, '../../src/app/globals.css'),
        'utf-8'
      )

      expect(globalsCss).toContain('--radius: 1.25rem')
      expect(globalsCss).toContain('--background: 36 100% 97%')
      expect(globalsCss).toContain('--foreground: 287 29% 20%')
      expect(globalsCss).toContain('--primary: 39 89% 71%')
      expect(globalsCss).toContain('--secondary: 346 76% 80%')
      expect(globalsCss).toContain('--border: 287 29% 20% / 0.08')
    })

    it('verifies layout.tsx defines Google font variables', () => {
      const layoutTsx = fs.readFileSync(
        path.resolve(__dirname, '../../src/app/layout.tsx'),
        'utf-8'
      )

      expect(layoutTsx).toContain("variable: '--font-fraunces'")
      expect(layoutTsx).toContain("variable: '--font-jakarta'")
      expect(layoutTsx).toContain("variable: '--font-tiro'")
    })
  })
})
