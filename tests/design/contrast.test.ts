import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Colour maths from WCAG 2.1, applied to the tokens the app really ships (A2). */

type Rgb = [number, number, number]

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Colour `fg` painted at `alpha` over `bg`. */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha))) as Rgb
}

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
function token(name: string): Rgb {
  const match = new RegExp(
    `--${name}:\\s*(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)%\\s+(\\d+(?:\\.\\d+)?)%`
  ).exec(css)
  if (!match) throw new Error(`token --${name} not found in globals.css`)
  return hslToRgb(Number(match[1]), Number(match[2]), Number(match[3]))
}

const IVORY = token('background')
const PLUM = token('foreground')
const TERRACOTTA = token('destructive')
const WHITE: Rgb = [255, 255, 255]
const MUTED = token('muted')

const AA_TEXT = 4.5

describe('shipped colour tokens meet WCAG AA for text (A2)', () => {
  it('Royal Plum ink on Warm Ivory is AAA', () => {
    expect(contrast(PLUM, IVORY)).toBeGreaterThanOrEqual(7)
  })

  it('Terracotta, used as warning text, is readable on ivory and on its own tinted panels', () => {
    expect(contrast(TERRACOTTA, IVORY)).toBeGreaterThanOrEqual(AA_TEXT)
    for (const tint of [0.05, 0.1]) {
      expect(contrast(TERRACOTTA, over(TERRACOTTA, IVORY, tint))).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('the destructive button (ivory on terracotta) is readable', () => {
    expect(contrast(token('destructive-foreground'), TERRACOTTA)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('secondary text (plum at 70%) is readable on every surface it sits on', () => {
    for (const surface of [IVORY, WHITE, MUTED]) {
      expect(contrast(over(PLUM, surface, 0.7), surface)).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('plum at 60% is NOT enough, which is why informational text uses 70%', () => {
    expect(contrast(over(PLUM, IVORY, 0.6), IVORY)).toBeLessThan(AA_TEXT)
  })

  it('pastel fills are never text: marigold and rose are far below 3:1 on ivory', () => {
    expect(contrast(token('primary'), IVORY)).toBeLessThan(3)
    expect(contrast(token('secondary'), IVORY)).toBeLessThan(3)
  })

  it('plum text on the pastel fills it is used with is AAA', () => {
    expect(contrast(PLUM, token('primary'))).toBeGreaterThanOrEqual(7)
    expect(contrast(PLUM, token('secondary'))).toBeGreaterThanOrEqual(7)
  })
})

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? sourceFiles(full) : full.endsWith('.tsx') ? [full] : []
  })
}

const files = sourceFiles(join(process.cwd(), 'src')).map((path) => ({
  path: path.replace(`${process.cwd()}/`, ''),
  lines: readFileSync(path, 'utf8').split('\n'),
}))

/** Lines that are allowed to use low-contrast text: disabled, out-of-range and decorative. */
const EXEMPT = /disabled:|cursor-not-allowed|outside:|aria-hidden|>•</

describe('source never uses text classes that fail contrast (A2)', () => {
  it('no informational text is lighter than plum at 70%', () => {
    const offenders: string[] = []
    for (const { path, lines } of files) {
      lines.forEach((line, i) => {
        for (const m of line.matchAll(/(?<![\w-])text-royal-plum\/(\d+)\b/g)) {
          if (Number(m[1]) < 70 && !EXEMPT.test(line)) offenders.push(`${path}:${i + 1} ${m[0]}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('pastel colours are only used as text on decorative icons marked aria-hidden', () => {
    const offenders: string[] = []
    for (const { path, lines } of files) {
      lines.forEach((line, i) => {
        if (/(?<![\w-])text-(marigold|gulabi-rose|primary|secondary)\b/.test(line)) {
          const element = lines.slice(i, i + 4).join(' ')
          if (!/aria-hidden/.test(element)) offenders.push(`${path}:${i + 1}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })
})
