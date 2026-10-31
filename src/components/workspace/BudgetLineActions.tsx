'use client'

import React from 'react'
import type { BudgetCategory, BudgetLine } from '@/lib/engine/types'
import { formatINR } from '@/lib/engine/currency'
import { Button } from '@/components/ui/button'
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
import { pulseHaptic } from './plan-status'

/**
 * Invisible hit-area extension for the h-8 (32px) `sm` buttons: the ::before box grows 6px above
 * and below (32 + 12 = 44px). Widths are already well over 44px, so no horizontal inset is needed.
 * The pseudo-element is transparent and out of flow, so visible size and layout are unchanged.
 */
const TOUCH_TARGET_CLASSES = "relative before:absolute before:-inset-y-1.5 before:content-['']"

interface BudgetLineActionsProps {
  line: BudgetLine
  onSetProtected: (category: BudgetCategory) => void
  onCheckQuote?: (category: BudgetCategory) => void
  onUnlockQuote?: (category: BudgetCategory) => void
}

/** Confirmation dialog that releases a committed quote's locked allocation. */
function UnlockQuoteDialog({
  line,
  onUnlockQuote,
}: {
  line: BudgetLine
  onUnlockQuote?: (category: BudgetCategory) => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('underline underline-offset-4', TOUCH_TARGET_CLASSES)}
        >
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
            allocation and re-open the category&apos;s primary booking task on your timeline. Your
            existing plan snapshot remains safely preserved.
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
  )
}

/** The quote and protected-moment buttons on the right of a budget row. */
export function BudgetLineActions({
  line,
  onSetProtected,
  onCheckQuote,
  onUnlockQuote,
}: BudgetLineActionsProps) {
  const handleToggleProtected = () => {
    // Micro-haptic pulse on user tap (MOMENT-03, T-05-09)
    pulseHaptic()
    onSetProtected(line.category)
  }

  return (
    <div className="-mr-2 flex flex-wrap items-center gap-x-1 gap-y-3">
      {line.isCommitted ? (
        <UnlockQuoteDialog line={line} onUnlockQuote={onUnlockQuote} />
      ) : onCheckQuote ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('underline underline-offset-4', TOUCH_TARGET_CLASSES)}
          onClick={() => onCheckQuote(line.category)}
        >
          Check Quote
        </Button>
      ) : null}

      {line.isProtected ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('underline underline-offset-4', TOUCH_TARGET_CLASSES)}
          onClick={handleToggleProtected}
          title="Make this category your Protected Moment"
        >
          Set as Protected
        </Button>
      )}
    </div>
  )
}
