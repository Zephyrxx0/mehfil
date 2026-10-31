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
import { cn } from '@/lib/utils'
import { BudgetLineActions } from './BudgetLineActions'
import { BudgetLineFacts } from './BudgetLineFacts'
import {
  BudgetLineStatus,
  hasBudgetLineStatus,
  type DisplacedDonorRecord,
} from './BudgetLineStatus'
import { deriveBudgetLineView } from './budget-line-view'
import { categoryAnchorId } from './plan-status'

export type { DisplacedDonorRecord }

export interface BudgetLineRowProps {
  line: BudgetLine
  totalBudgetPaise: number
  onSetProtected: (category: BudgetCategory) => void
  displacedRecords?: DisplacedDonorRecord[]
  onCheckQuote?: (category: BudgetCategory) => void
  onUnlockQuote?: (category: BudgetCategory) => void
  isReadOnly?: boolean
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

/** Name with its category icon on the left, current amount on the right. */
function BudgetLineHeading({ line }: { line: BudgetLine }) {
  const Icon = CATEGORY_ICONS[line.category] ?? Package
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="flex min-w-0 items-center gap-2.5 text-base font-semibold text-royal-plum">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full',
            line.isProtected
              ? 'bg-gulabi-rose/25 text-royal-plum'
              : 'bg-marigold/15 text-royal-plum/80'
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 truncate">{line.name}</span>
      </h3>
      <div className="shrink-0 text-right">
        <span className="font-serif text-lg font-bold tabular-nums text-royal-plum">
          {formatINR(line.currentPaise)}
        </span>
      </div>
    </div>
  )
}

/** The share-of-budget bar; its width eases to the new share unless motion is reduced. */
function AllocationBar({ isProtected, percentage }: { isProtected?: boolean; percentage: number }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <div className="ml-[2.625rem] mt-3 h-1.5 overflow-hidden rounded-full bg-royal-plum/10">
      <motion.div
        className={cn('h-full rounded-full', isProtected ? 'bg-gulabi-rose' : 'bg-marigold')}
        initial={false}
        animate={{ width: `${percentage}%` }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 20, stiffness: 90 }
        }
      />
    </div>
  )
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
  const view = deriveBudgetLineView(line, totalBudgetPaise)

  return (
    <li
      id={categoryAnchorId(line.category)}
      data-protected={line.isProtected ? 'true' : undefined}
      className={cn(
        'scroll-mt-20 px-4 py-3.5 transition-colors sm:px-5',
        line.isProtected
          ? 'relative bg-gulabi-rose/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-gulabi-rose'
          : 'hover:bg-royal-plum/[0.025]'
      )}
    >
      <BudgetLineHeading line={line} />

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pl-[2.625rem] text-sm text-royal-plum/70">
        <BudgetLineFacts line={line} view={view} />
        {!isReadOnly && (
          <BudgetLineActions
            line={line}
            onSetProtected={onSetProtected}
            onCheckQuote={onCheckQuote}
            onUnlockQuote={onUnlockQuote}
          />
        )}
      </div>

      <AllocationBar isProtected={line.isProtected} percentage={view.percentageClamped} />

      {hasBudgetLineStatus(line, displacedRecords) && (
        <BudgetLineStatus line={line} displacedRecords={displacedRecords} />
      )}
    </li>
  )
}
