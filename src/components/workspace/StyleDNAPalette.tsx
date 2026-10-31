import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PaletteColor } from './style-dna-view'

export interface StyleDNAPaletteProps {
  palette: PaletteColor[]
}

export function StyleDNAPalette({ palette }: StyleDNAPaletteProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-royal-plum">Named Festive Palette</h3>
      <TooltipProvider>
        <ul className="mt-3 flex flex-col gap-2">
          {palette.map((color, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-royal-plum/20"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <span className="font-semibold">{color.name}</span>
                  <span className="ml-1 font-mono text-royal-plum/70">{color.hex}</span>
                </TooltipContent>
              </Tooltip>
              <span className="text-royal-plum">{color.name}</span>
              <span className="font-mono text-xs text-royal-plum/70">{color.hex}</span>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </div>
  )
}
