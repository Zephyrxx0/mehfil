/**
 * Firework shapes, each drawn in a -50..50 box centred on the burst. Pure data:
 * the component turns it into SVG and CSS animates it. Everything is
 * deterministic so server and client markup match.
 */

export type FireworkType = 'peony' | 'willow' | 'ring' | 'palm' | 'chakri'
export type FireworkColour = 'maroon' | 'rose' | 'marigold'

/** A line that shoots outwards as a short bright streak. */
export interface Streak {
  d: string
  colour: FireworkColour
  weight: number
  /** Start of this layer, as a fraction of the cycle. */
  delay: number
}

/** A spark that flies from the centre to (dx, dy), then falls to (dx, dy + fall). */
export interface Spark {
  dx: number
  dy: number
  fall: number
  r: number
  colour: FireworkColour
  delay: number
}

/** A ring that expands from the centre. */
export interface Ring {
  r: number
  colour: FireworkColour
  weight: number
  delay: number
}

/** Embers left hanging after the burst, twinkling on their own clock. */
export interface Twinkle {
  x: number
  y: number
  r: number
  colour: FireworkColour
  /** Seconds. */
  period: number
  /** Fraction of the period. */
  phase: number
}

/** A soft filled disc that swells from the centre and fades, colouring the burst under its lines. */
export interface Bloom {
  r: number
  colour: FireworkColour
  /** Fill opacity at its brightest, 0 to 1. */
  opacity: number
  delay: number
}

export interface FireworkShape {
  /** Colour washes, painted first so the streaks, rings and sparks stay crisp on top. */
  blooms: Bloom[]
  streaks: Streak[]
  sparks: Spark[]
  rings: Ring[]
  twinkles: Twinkle[]
  /** Seconds per turn, for shapes that spin. */
  spin?: number
}

type BareShape = Omit<FireworkShape, 'blooms'>

const BLOOMS: Record<FireworkType, Bloom[]> = {
  peony: [
    { r: 34, colour: 'rose', opacity: 0.16, delay: 0 },
    { r: 20, colour: 'marigold', opacity: 0.3, delay: 0.02 },
    { r: 7, colour: 'maroon', opacity: 0.4, delay: 0.04 },
  ],
  willow: [
    { r: 30, colour: 'marigold', opacity: 0.16, delay: 0.02 },
    { r: 15, colour: 'rose', opacity: 0.26, delay: 0.06 },
  ],
  ring: [
    { r: 36, colour: 'rose', opacity: 0.14, delay: 0 },
    { r: 24, colour: 'marigold', opacity: 0.24, delay: 0.1 },
    { r: 12, colour: 'maroon', opacity: 0.3, delay: 0.2 },
  ],
  palm: [
    { r: 44, colour: 'marigold', opacity: 0.12, delay: 0 },
    { r: 26, colour: 'rose', opacity: 0.2, delay: 0.05 },
    { r: 9, colour: 'maroon', opacity: 0.32, delay: 0.08 },
  ],
  chakri: [
    { r: 40, colour: 'rose', opacity: 0.14, delay: 0 },
    { r: 18, colour: 'marigold', opacity: 0.34, delay: 0.02 },
  ],
}

const TAU = Math.PI * 2
const f = (n: number) => (Math.round(n * 10) / 10).toString()
const at = (r: number, a: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)]
const line = (r0: number, r1: number, a: number) => {
  const [x0, y0] = at(r0, a)
  const [x1, y1] = at(r1, a)
  return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`
}
const COLOURS: FireworkColour[] = ['marigold', 'rose', 'maroon']
/** Repeatable pseudo-random number in [0, 1). */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** A round chrysanthemum: long and short rays alternating, a spark on each long ray. */
function peony(): BareShape {
  const n = 28
  const streaks: Streak[] = []
  const sparks: Spark[] = []
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n - Math.PI / 2
    const long = i % 2 === 0
    streaks.push({
      d: line(7, long ? 38 : 28, a),
      colour: long ? 'marigold' : 'rose',
      weight: long ? 1.6 : 1.2,
      delay: 0,
    })
    if (long) {
      const [dx, dy] = at(41, a)
      sparks.push({ dx, dy, fall: 4, r: 1, colour: 'maroon', delay: 0 })
    }
  }
  return {
    streaks,
    sparks,
    rings: [{ r: 9, colour: 'marigold', weight: 1.2, delay: 0 }],
    twinkles: [],
  }
}

/** A willow: golden branches that arc over and droop, shedding glitter. */
function willow(): BareShape {
  const n = 16
  const streaks: Streak[] = []
  const sparks: Spark[] = []
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n - Math.PI / 2
    const [cx, cy] = at(20, a)
    const [ex, ey] = at(28, a)
    streaks.push({
      d: `M0 0Q${f(cx)} ${f(cy - 3)} ${f(ex)} ${f(ey + 16)}`,
      colour: 'marigold',
      weight: 1.6,
      delay: 0,
    })
    const b = a + Math.PI / n
    const [c2x, c2y] = at(14, b)
    const [e2x, e2y] = at(19, b)
    streaks.push({
      d: `M0 0Q${f(c2x)} ${f(c2y - 2)} ${f(e2x)} ${f(e2y + 10)}`,
      colour: 'rose',
      weight: 1.1,
      delay: 0.08,
    })
    sparks.push({ dx: ex, dy: ey + 14, fall: 8, r: 0.8, colour: 'marigold', delay: 0.1 })
  }
  return { streaks, sparks, rings: [], twinkles: [] }
}

/** Three nested rings expanding in turn, each carried by a circle of sparks. */
function ring(): BareShape {
  const layers: Array<{ r: number; colour: FireworkColour; delay: number }> = [
    { r: 36, colour: 'rose', delay: 0 },
    { r: 24, colour: 'marigold', delay: 0.1 },
    { r: 12, colour: 'maroon', delay: 0.2 },
  ]
  const rings: Ring[] = layers.map((l) => ({
    r: l.r,
    colour: l.colour,
    weight: 1.4,
    delay: l.delay,
  }))
  const sparks: Spark[] = []
  const streaks: Streak[] = []
  layers.forEach((l, li) => {
    const n = 12
    for (let i = 0; i < n; i++) {
      const a = (TAU * i) / n + (li % 2 ? Math.PI / n : 0) - Math.PI / 2
      const [dx, dy] = at(l.r, a)
      sparks.push({ dx, dy, fall: 0, r: 1, colour: l.colour, delay: l.delay })
    }
  })
  for (let i = 0; i < 12; i++) {
    const a = (TAU * i) / 12 - Math.PI / 2
    streaks.push({ d: line(14, 36, a), colour: 'maroon', weight: 0.9, delay: 0.04 })
  }
  return { streaks, sparks, rings, twinkles: [] }
}

/** A grand palm: long maroon spokes, curved rose comets, a gold crossette layer, then embers. */
function palm(): BareShape {
  const streaks: Streak[] = []
  const sparks: Spark[] = []
  for (let i = 0; i < 16; i++) {
    const a = (TAU * i) / 16 - Math.PI / 2
    streaks.push({ d: line(6, 44, a), colour: 'maroon', weight: 2, delay: 0 })
    const [dx, dy] = at(46, a)
    sparks.push({ dx, dy, fall: 6, r: 1.2, colour: 'marigold', delay: 0 })
  }
  for (let i = 0; i < 8; i++) {
    const a = (TAU * i) / 8 - Math.PI / 2 + Math.PI / 16
    const [cx, cy] = at(24, a + 0.55)
    const [ex, ey] = at(40, a + 0.2)
    streaks.push({
      d: `M0 0Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`,
      colour: 'rose',
      weight: 1.6,
      delay: 0.06,
    })
  }
  for (let i = 0; i < 32; i++) {
    const a = (TAU * i) / 32 - Math.PI / 2 + Math.PI / 32
    streaks.push({ d: line(14, 31, a), colour: 'marigold', weight: 1.1, delay: 0.14 })
  }
  const twinkles: Twinkle[] = Array.from({ length: 30 }, (_, i) => {
    const a = hash(i + 1) * TAU
    const r = 14 + hash(i + 41) * 28
    const [x, y] = at(r, a)
    return {
      x,
      y: y + 3,
      r: 0.5 + hash(i + 7) * 0.7,
      colour: COLOURS[i % 3],
      period: 1.6 + hash(i + 19) * 1.8,
      phase: hash(i + 23),
    }
  })
  return { streaks, sparks, rings: [{ r: 8, colour: 'maroon', weight: 1.4, delay: 0 }], twinkles }
}

/** A chakri (spinning wheel): spiral arms of sparks, turning as they burn. */
function chakri(): BareShape {
  const arms = 6
  const streaks: Streak[] = []
  const sparks: Spark[] = []
  for (let k = 0; k < arms; k++) {
    const a0 = (TAU * k) / arms
    let d = ''
    for (let s = 0; s <= 24; s++) {
      const t = s / 24
      const r = 4 + t * 36
      const [x, y] = at(r, a0 + t * 1.5)
      d += `${s === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`
    }
    streaks.push({ d, colour: k % 2 ? 'rose' : 'marigold', weight: 1.7, delay: 0 })
    const [dx, dy] = at(44, a0 + 1.5)
    sparks.push({ dx, dy, fall: 0, r: 0.9, colour: 'maroon', delay: 0.02 })
  }
  return {
    streaks,
    sparks,
    rings: [{ r: 4, colour: 'marigold', weight: 1.2, delay: 0 }],
    twinkles: [],
    spin: 5,
  }
}

function bare(type: FireworkType): BareShape {
  switch (type) {
    case 'peony':
      return peony()
    case 'willow':
      return willow()
    case 'ring':
      return ring()
    case 'palm':
      return palm()
    case 'chakri':
      return chakri()
  }
}

export function buildFirework(type: FireworkType): FireworkShape {
  return { blooms: BLOOMS[type], ...bare(type) }
}
