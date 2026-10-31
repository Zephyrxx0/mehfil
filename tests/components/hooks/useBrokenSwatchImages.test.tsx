import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useBrokenSwatchImages } from '@/components/intake/hooks/useBrokenSwatchImages'
import { primarySwatchSrc, SWATCH_WEBP_SHIPPED, SWATCHES } from '@/data/swatches'

describe('swatch image sources', () => {
  const swatch = SWATCHES[0]

  it('requests the SVG directly while no webp photos are shipped', () => {
    expect(SWATCH_WEBP_SHIPPED).toBe(false)
    const { result } = renderHook(() => useBrokenSwatchImages())
    expect(result.current.srcFor(swatch)).toBe(swatch.svgFallback)
  })

  it('never requests a webp for any swatch by default', () => {
    const { result } = renderHook(() => useBrokenSwatchImages())
    for (const s of SWATCHES) expect(result.current.srcFor(s)).toMatch(/\.svg$/)
  })

  it('primarySwatchSrc picks the webp only when it is flagged as shipped', () => {
    expect(primarySwatchSrc(swatch, true)).toBe(swatch.image)
    expect(primarySwatchSrc(swatch, false)).toBe(swatch.svgFallback)
  })

  it('markBroken still resolves to the SVG fallback', () => {
    const { result } = renderHook(() => useBrokenSwatchImages())
    act(() => result.current.markBroken(swatch.id))
    expect(result.current.srcFor(swatch)).toBe(swatch.svgFallback)
  })
})
