import React from 'react'
import { buildMandala, type RangoliColour } from './geometry'
import { cn } from '@/lib/utils'

export const COLOUR: Record<RangoliColour, string> = {
  maroon: 'hsl(var(--maroon))',
  rose: 'hsl(346 62% 58%)',
  marigold: 'hsl(39 90% 56%)',
}

export interface RangoliProps {
  /** Opacity of the thin base lines. */
  baseOpacity?: number
  className?: string
}

const GROUPS = buildMandala()

/**
 * A 12-fold rangoli mandala. Soft colour washes fill the petals; thin lines are the base design; thick lines draw
 * and erase themselves ring by ring; three groups of rings turn slowly in
 * alternating directions while the dots pulse in waves. Decorative only.
 */
export function Rangoli({ baseOpacity = 0.4, className }: RangoliProps) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      focusable="false"
      data-rangoli="mandala"
      className={cn('pointer-events-none aspect-square', className)}
    >
      {GROUPS.map((group) => (
        <g
          key={group.id}
          data-rangoli-group={group.id}
          className="rangoli-group"
          style={
            {
              '--rangoli-spin': `${group.spin}s`,
              '--rangoli-dir': group.reverse ? 'reverse' : 'normal',
            } as React.CSSProperties
          }
        >
          <g data-rangoli-fills="" stroke="none">
            {group.fills.map((fill, i) => (
              <path
                key={i}
                d={fill.d}
                fill={COLOUR[fill.colour]}
                fillOpacity={fill.opacity}
                fillRule="evenodd"
              />
            ))}
          </g>

          <g
            fill="none"
            stroke="hsl(var(--maroon))"
            strokeOpacity={baseOpacity}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {group.base.map((d, i) => (
              <path key={i} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {group.dots.map((ring, ri) =>
            ring.points.map(([x, y], i) => (
              <circle
                key={`${ri}-${i}`}
                cx={x}
                cy={y}
                r={ring.radius}
                fill="hsl(var(--maroon))"
                className="rangoli-dot"
                style={
                  {
                    '--rangoli-pulse': `${ring.seconds}s`,
                    '--rangoli-delay': `${-(i / ring.points.length) * ring.seconds}s`,
                  } as React.CSSProperties
                }
              />
            ))
          )}

          {group.traces.map((trace, i) => (
            <path
              key={i}
              d={trace.d}
              pathLength={1}
              className="rangoli-trace"
              fill="none"
              stroke={COLOUR[trace.colour]}
              strokeWidth={trace.weight}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={
                {
                  '--rangoli-trace': `${trace.seconds}s`,
                  '--rangoli-delay': `${-trace.offset}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      ))}
    </svg>
  )
}
