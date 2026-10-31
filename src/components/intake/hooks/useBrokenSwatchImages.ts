import { useState } from 'react'
import type { StyleSwatch } from '@/data/swatches'

/** Remembers which swatch photos failed to load and serves the SVG fallback for those. */
export function useBrokenSwatchImages() {
  const [broken, setBroken] = useState<Record<string, boolean>>({})

  const srcFor = (swatch: StyleSwatch) => (broken[swatch.id] ? swatch.svgFallback : swatch.image)
  const markBroken = (id: string) => setBroken((prev) => ({ ...prev, [id]: true }))

  return { srcFor, markBroken }
}
