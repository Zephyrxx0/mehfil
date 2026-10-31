'use client'

import React from 'react'
import type { BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface DisplacedDonorRecord {
  ideaTitle: string
  displacedPaise: number
}

interface BudgetLineStatusProps {
  line: BudgetLine
  displacedRecords?: DisplacedDonorRecord[]
}

/** Whether a row has any state note (committed, protected or displaced) to show. */
export function hasBudgetLineStatus(
  line: BudgetLine,
  displacedRecords?: DisplacedDonorRecord[]
): boolean {
  return Boolean(line.isCommitted || line.isProtected || (displacedRecords?.length ?? 0) > 0)
}

function ProtectedMomentBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p
            data-testid="protected-moment-badge"
            className="inline-flex w-fit cursor-help items-center gap-1.5 rounded-full bg-gulabi-rose/25 px-2.5 py-0.5 text-xs font-semibold text-royal-plum"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gulabi-rose" />
            Protected Moment
            <span className="font-normal text-royal-plum/70">· immune to displacement</span>
          </p>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          Protected Moment is mathematically immune to displacement (ADR-0004)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** The state notes under a budget row: committed quote, protected moment and displaced donors. */
export function BudgetLineStatus({ line, displacedRecords }: BudgetLineStatusProps) {
  return (
    <div className="ml-[2.625rem] mt-3 flex flex-col gap-1.5 text-sm">
      {line.isCommitted && (
        <p
          data-testid="committed-quote-badge"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#2E5A44]/12 px-2.5 py-0.5 text-xs font-semibold text-[#2E5A44]"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#2E5A44]" />
          Committed: {line.committedVendor}
          {line.committedTierName ? ` (${line.committedTierName})` : ''}
        </p>
      )}

      {line.isProtected && <ProtectedMomentBadge />}

      {line.isProtected && line.protectedQuote && (
        <p className="font-serif italic text-royal-plum/80">&ldquo;{line.protectedQuote}&rdquo;</p>
      )}

      {displacedRecords && displacedRecords.length > 0 && (
        <ul data-testid="donor-tags" className="flex flex-col gap-0.5 text-royal-plum/70">
          {displacedRecords.map((record, idx) => (
            <li key={idx} className="tabular-nums">
              -{formatINR(record.displacedPaise)} for {record.ideaTitle}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
