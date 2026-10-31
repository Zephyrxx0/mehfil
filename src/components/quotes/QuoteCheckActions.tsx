import React from 'react'
import { FileText, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuoteCheckActionsProps {
  categoryName: string
  isCommitting: boolean
  onCommit: () => void
  onViewRawText: () => void
}

/** Primary "commit" action plus the secondary "view verbatim excerpt" action. */
export function QuoteCheckActions({
  categoryName,
  isCommitting,
  onCommit,
  onViewRawText,
}: QuoteCheckActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      <Button
        type="button"
        onClick={onCommit}
        disabled={isCommitting}
        className="h-12 w-full rounded-full bg-marigold text-royal-plum font-semibold text-base shadow-md hover:scale-[1.01] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 border border-royal-plum/20"
      >
        <Lock className="w-4 h-4" />
        <span>Commit {categoryName} Quote</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onViewRawText}
        className="h-12 w-full sm:w-auto rounded-full border-royal-plum/15 text-royal-plum font-medium text-xs px-5 hover:bg-royal-plum/5 shrink-0"
      >
        <FileText className="w-3.5 h-3.5 mr-1" />
        <span>View Verbatim Quote Excerpt</span>
      </Button>
    </div>
  )
}
