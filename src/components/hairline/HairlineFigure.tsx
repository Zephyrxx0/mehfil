'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/logger'
const logger = createLogger('hairline')

/**
 * Hosts one Hairline figure (isometric line art that answers the pointer).
 *
 * The kernel (`/hairline/kernel.js`) and each figure (`/hairline/<name>.js`) are
 * served untouched from /public. The kernel defines the `HL` global; a figure is
 * an ES module that ends with `hairline({ name, means, rules, range, mount })`,
 * which this host captures and mounts into its own stage.
 */

export type HairlineName = 'diyas' | 'bangles' | 'laddoos'

interface Figure {
  name: string
  means: string
  range: [number, number, number]
  mount: (
    host: { stage: HTMLElement; svg: SVGElement; read: { textContent: string } },
    value: number
  ) => { set: (v: number) => void; destroy: () => void }
}

type HairlineWindow = Window & {
  HL?: any
  hairline?: (figure: Figure) => void
  __hairlineFigures?: Map<string, Figure>
}

let kernelReady: Promise<void> | null = null

function loadKernel(): Promise<void> {
  const w = window as HairlineWindow
  if (w.HL) return Promise.resolve()
  kernelReady ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/hairline/kernel.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      kernelReady = null
      reject(new Error('hairline: kernel failed to load'))
    }
    document.head.appendChild(script)
  })
  return kernelReady
}

async function loadFigure(name: HairlineName): Promise<Figure | undefined> {
  await loadKernel()
  const w = window as HairlineWindow
  const registry = (w.__hairlineFigures ??= new Map<string, Figure>())
  w.hairline = (figure) => {
    registry.set(figure.name, figure)
  }
  if (!registry.has(name)) {
    await import(/* webpackIgnore: true */ /* @vite-ignore */ `/hairline/${name}.js`)
  }
  return registry.get(name)
}

export interface HairlineFigureProps {
  name: HairlineName
  className?: string
}

export function HairlineFigure({ name, className }: HairlineFigureProps) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let cancelled = false
    let handle: { destroy: () => void } | undefined

    loadFigure(name)
      .then((figure) => {
        if (cancelled || !figure) return
        const HL = (window as HairlineWindow).HL
        HL.inject(document)
        stage.setAttribute('data-hairline', figure.name)
        const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage)
        const read = { textContent: '' }
        handle = figure.mount({ stage, svg, read }, figure.range[1])
      })
      .catch((err) => {
        // Decorative only: a failed figure must never break the page.
        logger.warn('[HairlineFigure]', err)
      })

    return () => {
      cancelled = true
      handle?.destroy()
      stage.replaceChildren()
      stage.removeAttribute('data-hairline')
    }
  }, [name])

  return <div ref={stageRef} className={cn('hairline-mehendi', className)} aria-hidden="true" />
}
