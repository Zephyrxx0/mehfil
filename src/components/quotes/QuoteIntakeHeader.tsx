import React from 'react'
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShieldAlert, RotateCcw } from 'lucide-react'

interface QuoteIntakeHeaderProps {
  title: string
  showReset: boolean
  onReset: () => void
}

/** Sheet header: brand line, optional "check another" action, title and quarantine notice. */
export function QuoteIntakeHeader({ title, showReset, onReset }: QuoteIntakeHeaderProps) {
  return (
    <SheetHeader className="gap-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs text-royal-plum/70 tracking-wider">
          <span lang="hi" className="font-devanagari">
            महफ़िल
          </span>{' '}
          Quote Sandbox
        </span>
        {showReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs font-semibold text-royal-plum/70 hover:text-royal-plum flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Check Another Quote</span>
          </Button>
        )}
      </div>

      <SheetTitle className="font-serif text-xl font-bold text-royal-plum">{title}</SheetTitle>

      <SheetDescription className="text-xs text-royal-plum/70 leading-relaxed bg-soft-ivory p-3 rounded-xl border border-royal-plum/8 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-marigold shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Untrusted vendor quotes are safely quarantined with zero database access. Numbers are
          verified verbatim before touching your plan.
        </span>
      </SheetDescription>
    </SheetHeader>
  )
}
