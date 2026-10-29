'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Landmark,
  Utensils,
  Flower2,
  Camera,
  Music,
  Gift,
  Package,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react'
import type { BudgetCategory, BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface DisplacedDonorRecord {
  ideaTitle: string
  displacedPaise: number
}

export interface BudgetLineRowProps {
  line: BudgetLine
  totalBudgetPaise: number
  onSetProtected: (category: BudgetCategory) => void
  displacedRecords?: DisplacedDonorRecord[]
  onCheckQuote?: (category: BudgetCategory) => void
  onUnlockQuote?: (category: BudgetCategory) => void
  isReadOnly?: boolean
}

const LINE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_guest: 'Per guest',
  flexible: 'Flexible',
  buffer: 'Buffer',
}

/** A small festive icon for each budget category, shown in a tinted circle. */
const CATEGORY_ICONS: Record<BudgetCategory, LucideIcon> = {
  venue: Landmark,
  catering: Utensils,
  decor: Flower2,
  photo_film: Camera,
  entertainment: Music,
  favors: Gift,
  misc: Package,
  contingency: PiggyBank,
}

/** One budget line: name and facts on the left, amount on the right, share-of-budget bar underneath. */
export function BudgetLineRow({
  line,
  totalBudgetPaise,
  onSetProtected,
  displacedRecords,
  onCheckQuote,
  onUnlockQuote,
  isReadOnly = false,
}: BudgetLineRowProps) {
  const shouldReduceMotion = useReducedMotion()

  const rawPercentage = totalBudgetPaise > 0 ? (line.currentPaise / totalBudgetPaise) * 100 : 0
  const percentageClamped = Math.min(100, Math.max(0, rawPercentage))
  const delta = line.currentPaise - line.baselinePaise
  const floorAmount = Math.round((line.baselinePaise * 0.4) / 100) * 100

  const handleToggleProtected = () => {
    // Micro-haptic pulse on user tap (MOMENT-03, T-05-09)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50)
      } catch {
        // Safe fallback in unsupported or restricted iframe contexts
      }
    }
    onSetProtected(line.category)
  }

  const facts: React.ReactNode[] = [
    <span key="pct" className="tabular-nums">
      {rawPercentage.toFixed(1)}% of total budget
    </span>,
  ]
  if (!line.isCommitted && !line.isProtected) {
    facts.push(<span key="type">{LINE_TYPE_LABELS[line.lineType] || line.lineType}</span>)
  }
  if (line.lineType === 'flexible' && !line.isProtected) {
    facts.push(
      <span key="floor" data-testid="floor-indicator" className="tabular-nums">
        40% floor: {formatINR(floorAmount)} protected
      </span>
    )
  }

  if (line.isCommitted && line.variancePaise !== undefined) {
    facts.push(
      <span
        key="variance"
        data-testid="committed-variance-badge"
        className={cn(
          'tabular-nums',
          line.variancePaise > 0 ? 'text-[#2E5A44]' : line.variancePaise < 0 ? 'text-terracotta' : ''
        )}
      >
        {line.variancePaise > 0
          ? `Saved ${formatINR(line.variancePaise)}`
          : line.variancePaise < 0
          ? `+${formatINR(Math.abs(line.variancePaise))} actual`
          : 'Exact to allocation'}
      </span>
    )
  } else if (delta !== 0) {
    facts.push(
      <span key="delta" className={cn('tabular-nums', delta > 0 ? 'text-[#2E5A44]' : 'text-terracotta')}>
        {delta > 0 ? `+${formatINR(delta)}` : `-${formatINR(Math.abs(delta))}`} vs baseline
      </span>
    )
  }

  const Icon = CATEGORY_ICONS[line.category] ?? Package

  return (
    <li
      id={`category-${line.category}`}
      data-protected={line.isProtected ? 'true' : undefined}
      className={cn(
        'scroll-mt-20 px-4 py-3.5 transition-colors sm:px-5',
        line.isProtected
          ? 'relative bg-gulabi-rose/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-gulabi-rose'
          : 'hover:bg-royal-plum/[0.025]'
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="flex min-w-0 items-center gap-2.5 text-base font-semibold text-royal-plum">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full',
              line.isProtected ? 'bg-gulabi-rose/25 text-royal-plum' : 'bg-marigold/15 text-royal-plum/80'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 truncate">{line.name}</span>
        </h4>
        <div className="shrink-0 text-right">
          <span className="font-serif text-lg font-bold tabular-nums text-royal-plum">
            {formatINR(line.currentPaise)}
          </span>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pl-[2.625rem] text-sm text-royal-plum/60">
        <p className="flex flex-wrap items-baseline gap-x-2">
          {facts.map((f, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span aria-hidden="true">·</span>}
              {f}
            </React.Fragment>
          ))}
        </p>
      {!isReadOnly && (
        <div className="-mr-2 flex flex-wrap items-center gap-1">
          {line.isCommitted ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="underline underline-offset-4">
                  Unlock / Replace Quote
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-lg font-bold">
                    Unlock / Replace Quote
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm leading-relaxed text-royal-plum/70">
                    Unlock this committed quote? This will release the locked{' '}
                    <strong className="font-semibold text-royal-plum">
                      {formatINR(line.committedPaise ?? line.currentPaise)}
                    </strong>{' '}
                    allocation and re-open the category&apos;s primary booking task on your timeline.
                    Your existing plan snapshot remains safely preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Quote</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUnlockQuote?.(line.category)}
                    className="bg-terracotta text-warm-ivory hover:bg-terracotta/90"
                  >
                    Unlock Quote
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : onCheckQuote ? (
            <Button type="button" variant="ghost" size="sm" className="underline underline-offset-4" onClick={() => onCheckQuote(line.category)}>
              Check Quote
            </Button>
          ) : null}

          {line.isProtected ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="underline underline-offset-4"
              onClick={handleToggleProtected}
              title="Make this category your Protected Moment"
            >
              Set as Protected
            </Button>
          )}
        </div>
      )}
      </div>

      {/* Allocation bar */}
      <div className="ml-[2.625rem] mt-3 h-1.5 overflow-hidden rounded-full bg-royal-plum/10">
        <motion.div
          className={cn('h-full rounded-full', line.isProtected ? 'bg-gulabi-rose' : 'bg-marigold')}
          initial={false}
          animate={{ width: `${percentageClamped}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', damping: 20, stiffness: 90 }
          }
        />
      </div>

      {/* State notes */}
      {(line.isCommitted || line.isProtected || (displacedRecords && displacedRecords.length > 0)) && (
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

          {line.isProtected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    data-testid="protected-moment-badge"
                    className="inline-flex w-fit cursor-help items-center gap-1.5 rounded-full bg-gulabi-rose/25 px-2.5 py-0.5 text-xs font-semibold text-royal-plum"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gulabi-rose" />
                    Protected Moment
                    <span className="font-normal text-royal-plum/60">· immune to displacement</span>
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Protected Moment is mathematically immune to displacement (ADR-0004)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

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
      )}

    </li>
  )
}
