/**
 * Rangoli geometry: one 12-fold mandala built from concentric layers that all
 * share the same angular grid, so every ring lines up with its neighbours.
 *
 * Coordinates live in a -100..100 square centred on (0, 0). Each layer has thin
 * static `base` lines, optional dots, and optional thick `traces` (the same
 * shapes again, drawn in and out). Layers are grouped so each group can turn at
 * its own speed and direction without breaking the 12-fold symmetry.
 */

export type RangoliColour = 'maroon' | 'rose' | 'marigold'

export interface RangoliTrace {
  d: string
  colour: RangoliColour
  /** Seconds for one draw-and-erase cycle. */
  seconds: number
  /** Seconds of negative delay so traces never start together. */
  offset: number
  /** Stroke width in px. */
  weight: number
}

/** A solid colour wash laid under the line work. Drawn with the even-odd rule so a path can leave holes. */
export interface RangoliFill {
  d: string
  colour: RangoliColour
  /** Fill opacity, 0 to 1. */
  opacity: number
}

export interface RangoliDots {
  points: Array<[number, number]>
  radius: number
  /** Seconds for the pulse to travel once round the ring. */
  seconds: number
}

export interface RangoliGroup {
  id: string
  /** Seconds per full turn. */
  spin: number
  reverse: boolean
  base: string[]
  /** Colour washes, painted first (bottom to top) so the thin lines stay crisp on top. */
  fills: RangoliFill[]
  traces: RangoliTrace[]
  dots: RangoliDots[]
}

const FOLD = 12
const STEP = (Math.PI * 2) / FOLD
const f = (n: number) => (Math.round(n * 10) / 10).toString()
const pt = (r: number, a: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)]
const xy = ([x, y]: [number, number]) => `${f(x)} ${f(y)}`
// Angle 0 points up, so the design stands upright.
const UP = -Math.PI / 2

function ring(r: number): string {
  return `M${f(r)} 0A${f(r)} ${f(r)} 0 1 1 ${f(-r)} 0A${f(r)} ${f(r)} 0 1 1 ${f(r)} 0Z`
}

/** `n` pointed petals between radii r0 and r1; `w` is the half-width in radians at the widest point. */
function petals(n: number, r0: number, r1: number, w: number, phase = 0): string {
  const s = r1 - r0
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = UP + phase + (Math.PI * 2 * i) / n
    d +=
      `M${xy(pt(r0, a))}` +
      `C${xy(pt(r0 + s * 0.28, a - w * 1.25))} ${xy(pt(r0 + s * 0.72, a - w * 0.8))} ${xy(pt(r1, a))}` +
      `C${xy(pt(r0 + s * 0.72, a + w * 0.8))} ${xy(pt(r0 + s * 0.28, a + w * 1.25))} ${xy(pt(r0, a))}Z`
  }
  return d
}

/** A ring of `n` shallow scallops sitting on radius r, bulging outwards. */
function scallops(n: number, r: number, flatten: number, phase = 0): string {
  const chord = 2 * r * Math.sin(Math.PI / n)
  const s = (chord / 2) * flatten
  let d = `M${xy(pt(r, UP + phase))}`
  for (let i = 1; i <= n; i++) {
    d += `A${f(s)} ${f(s)} 0 0 1 ${xy(pt(r, UP + phase + (Math.PI * 2 * i) / n))}`
  }
  return d + 'Z'
}

function ringPoints(n: number, r: number, phase = 0): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => pt(r, UP + phase + (Math.PI * 2 * i) / n))
}

export function buildMandala(): RangoliGroup[] {
  const half = STEP / 2

  return [
    {
      // Heart of the flower: two interleaved rings of small petals.
      id: 'heart',
      spin: 140,
      reverse: true,
      base: [ring(4), petals(FOLD, 10, 26, 0.2), petals(FOLD, 14, 42, 0.2, half)],
      fills: [
        { d: petals(FOLD, 14, 42, 0.2, half), colour: 'rose', opacity: 0.4 },
        { d: petals(FOLD, 10, 26, 0.2), colour: 'marigold', opacity: 0.75 },
        { d: ring(4), colour: 'maroon', opacity: 0.85 },
      ],
      traces: [
        { d: petals(FOLD, 10, 26, 0.2), colour: 'marigold', seconds: 9, offset: 0, weight: 2 },
        { d: petals(FOLD, 14, 42, 0.2, half), colour: 'rose', seconds: 11, offset: 3, weight: 2 },
      ],
      dots: [{ points: ringPoints(FOLD, 7.5, half), radius: 0.6, seconds: 4 }],
    },
    {
      // Lotus: large double-outlined petals between two dotted rings.
      id: 'lotus',
      spin: 200,
      reverse: false,
      base: [ring(46), petals(FOLD, 52, 82, 0.235), petals(FOLD, 57, 74, 0.13)],
      fills: [
        { d: petals(FOLD, 52, 82, 0.235), colour: 'rose', opacity: 0.32 },
        { d: petals(FOLD, 57, 74, 0.13), colour: 'marigold', opacity: 0.6 },
        // a thin band between the heart and the petals
        { d: ring(46) + ring(43), colour: 'maroon', opacity: 0.22 },
      ],
      traces: [
        { d: petals(FOLD, 52, 82, 0.235), colour: 'maroon', seconds: 13, offset: 5, weight: 2.4 },
      ],
      dots: [{ points: ringPoints(FOLD * 2, 49, 0), radius: 0.5, seconds: 6 }],
    },
    {
      // Border: a scalloped edge with a dotted rim.
      id: 'border',
      spin: 260,
      reverse: true,
      base: [ring(84), scallops(FOLD * 2, 84, 1.4, half / 2), ring(95)],
      fills: [
        // the rim band between the two outer circles, then the scalloped edge as a band (even-odd leaves the inside clear)
        { d: ring(95) + ring(90), colour: 'marigold', opacity: 0.3 },
        { d: scallops(FOLD * 2, 84, 1.4, half / 2) + ring(80), colour: 'rose', opacity: 0.4 },
      ],
      traces: [
        { d: scallops(FOLD * 2, 84, 1.4, half / 2), colour: 'maroon', seconds: 15, offset: 8, weight: 2 },
      ],
      dots: [{ points: ringPoints(FOLD * 4, 97.5, 0), radius: 0.4, seconds: 8 }],
    },
  ]
}
