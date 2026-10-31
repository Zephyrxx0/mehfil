/**
 * Writes the browser tab icon, src/app/icon.svg, from the landing-page rangoli geometry.
 *
 * The landing rangoli animates, which a tab icon cannot. The icon keeps the petal washes,
 * the base line work and the dots, drops the traces and the spin, and uses static colours
 * from the same palette.
 *
 *   node --experimental-strip-types scripts/build-app-icons.ts
 *
 * Node 22.18+ strips the TypeScript types without a flag. Re-run this after changing
 * geometry.ts, and commit the output.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildMandala, type RangoliColour } from '../src/components/rangoli/geometry.ts'

/** HSL to hex, so the icon uses exactly the colours the landing page declares. */
function hsl(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const c = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(c(0))}${to(c(8))}${to(c(4))}`.toUpperCase()
}

// Same values as Rangoli.tsx (rose, marigold) and globals.css (maroon).
const COLOUR: Record<RangoliColour, string> = {
  maroon: hsl(347, 62, 25),
  rose: hsl(346, 62, 58),
  marigold: hsl(39, 90, 56),
}
const IVORY = '#FFF8EE' // --background

/** The tab icon as SVG markup. Pure: the same geometry always gives the same bytes. */
export function renderTabIcon(): string {
  const groups = buildMandala()
  const r2 = (n: number) => (Math.round(n * 100) / 100).toString()

  const washes = groups
    .flatMap((g) => g.fills)
    .map(
      (fill) =>
        `<path d="${fill.d}" fill="${COLOUR[fill.colour]}" fill-opacity="${r2(fill.opacity)}" fill-rule="evenodd"/>`
    )
    .join('')

  const lines = groups
    .flatMap((g) => g.base)
    .map((d) => `<path d="${d}"/>`)
    .join('')

  const dots = groups
    .flatMap((g) =>
      g.dots.flatMap((ring) =>
        ring.points.map(([x, y]) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(ring.radius)}"/>`)
      )
    )
    .join('')

  // The base lines are 1 unit wide on the 200-unit design. At 16 to 32 px that is under a pixel,
  // so the icon draws them heavier. The mandala is scaled in so its outer petals keep a margin.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
<rect x="-100" y="-100" width="200" height="200" rx="34" fill="${IVORY}"/>
<g transform="scale(0.84)">
<g>${washes}</g>
<g fill="none" stroke="${COLOUR.maroon}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${lines}</g>
<g fill="${COLOUR.maroon}">${dots}</g>
</g>
</svg>
`

  return svg
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (isMain) {
  const svg = renderTabIcon()
  writeFileSync(join(process.cwd(), 'src', 'app', 'icon.svg'), svg)
  process.stdout.write(`wrote src/app/icon.svg (${svg.length} bytes)\n`)
}
