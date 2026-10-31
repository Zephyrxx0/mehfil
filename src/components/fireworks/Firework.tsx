import React from 'react'
import { buildFirework, type FireworkType } from './geometry'
import { COLOUR } from '@/components/rangoli/Rangoli'
import { cn } from '@/lib/utils'

export interface FireworkProps {
  type: FireworkType
  /** Seconds for one burst, from spark to afterglow. */
  seconds?: number
  /** Seconds to start into the cycle, so neighbours never burst together. */
  offset?: number
  className?: string
}

/**
 * One looping firework, drawn as thin streaks, sparks and rings in the page's
 * own palette. Decorative only. Five shapes: peony, willow, ring, palm, chakri.
 */
export function Firework({ type, seconds = 6, offset = 0, className }: FireworkProps) {
  const shape = buildFirework(type)
  const delay = (fraction: number) => `${fraction * seconds - offset}s`

  const body = (
    <>
      {shape.blooms.map((b, i) => (
        <circle
          key={`bloom-${i}`}
          r={b.r}
          fill={COLOUR[b.colour]}
          fillOpacity={b.opacity}
          className="fw-bloom"
          style={
            { '--fw-seconds': `${seconds}s`, '--fw-delay': delay(b.delay) } as React.CSSProperties
          }
        />
      ))}

      {shape.rings.map((r, i) => (
        <circle
          key={`ring-${i}`}
          r={r.r}
          fill="none"
          stroke={COLOUR[r.colour]}
          strokeWidth={r.weight}
          className="fw-ring"
          vectorEffect="non-scaling-stroke"
          style={
            { '--fw-seconds': `${seconds}s`, '--fw-delay': delay(r.delay) } as React.CSSProperties
          }
        />
      ))}

      {shape.streaks.map((s, i) => (
        <path
          key={`streak-${i}`}
          d={s.d}
          pathLength={1}
          fill="none"
          stroke={COLOUR[s.colour]}
          strokeWidth={s.weight}
          strokeLinecap="round"
          className="fw-streak"
          vectorEffect="non-scaling-stroke"
          style={
            { '--fw-seconds': `${seconds}s`, '--fw-delay': delay(s.delay) } as React.CSSProperties
          }
        />
      ))}

      {shape.sparks.map((s, i) => (
        <circle
          key={`spark-${i}`}
          r={s.r}
          fill={COLOUR[s.colour]}
          className="fw-spark"
          style={
            {
              '--fw-seconds': `${seconds}s`,
              '--fw-delay': delay(s.delay),
              '--dx': `${Math.round(s.dx * 10) / 10}px`,
              '--dy': `${Math.round(s.dy * 10) / 10}px`,
              '--dy2': `${Math.round((s.dy + s.fall) * 10) / 10}px`,
            } as React.CSSProperties
          }
        />
      ))}

      {shape.twinkles.map((t, i) => (
        <circle
          key={`twinkle-${i}`}
          cx={Math.round(t.x * 10) / 10}
          cy={Math.round(t.y * 10) / 10}
          r={t.r}
          fill={COLOUR[t.colour]}
          className="fw-twinkle"
          style={
            {
              '--fw-period': `${t.period}s`,
              '--fw-delay': `${-t.phase * t.period}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )

  return (
    <svg
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
      data-firework={type}
      className={cn('pointer-events-none aspect-square overflow-visible', className)}
    >
      {shape.spin ? (
        <g className="fw-spin" style={{ '--fw-spin': `${shape.spin}s` } as React.CSSProperties}>
          {body}
        </g>
      ) : (
        body
      )}
    </svg>
  )
}
