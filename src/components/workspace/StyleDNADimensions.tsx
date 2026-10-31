import React from 'react'
import { DIMENSION_LABELS, type DimensionEntry } from './style-dna-view'

export interface StyleDNADimensionsProps {
  topDimensions: DimensionEntry[]
}

export function StyleDNADimensions({ topDimensions }: StyleDNADimensionsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-royal-plum">Dominant Dimensions</h3>
      <ul className="mt-3 flex flex-col gap-3">
        {topDimensions.map(([key, value]) => (
          <li key={key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-royal-plum">{DIMENSION_LABELS[key] || key}</span>
              <span className="font-semibold tabular-nums text-royal-plum">{value}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-royal-plum/10">
              <div className="h-full rounded-full bg-marigold" style={{ width: `${value}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
