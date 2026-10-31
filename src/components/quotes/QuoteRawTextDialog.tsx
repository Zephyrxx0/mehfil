import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface QuoteRawTextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rawText: string
  highlightAnchor: string
}

/** Raw text with the matched anchor marked; plain text when there is no (matching) anchor. */
function HighlightedRawText({
  rawText,
  highlightAnchor,
}: Pick<QuoteRawTextDialogProps, 'rawText' | 'highlightAnchor'>) {
  if (!highlightAnchor || !rawText.toLowerCase().includes(highlightAnchor.toLowerCase())) {
    return (
      <pre className="font-mono text-xs whitespace-pre-wrap text-royal-plum/80 leading-relaxed bg-soft-ivory p-4 rounded-xl border border-royal-plum/10">
        {rawText}
      </pre>
    )
  }

  const startIndex = rawText.toLowerCase().indexOf(highlightAnchor.toLowerCase())
  const endIndex = startIndex + highlightAnchor.length

  const before = rawText.slice(0, startIndex)
  const match = rawText.slice(startIndex, endIndex)
  const after = rawText.slice(endIndex)

  return (
    <div className="font-mono text-xs whitespace-pre-wrap text-royal-plum/80 leading-relaxed bg-soft-ivory p-4 rounded-xl border border-royal-plum/10 max-h-[60vh] overflow-y-auto">
      <span>{before}</span>
      <mark className="bg-marigold text-royal-plum font-bold px-1.5 py-0.5 rounded-md border border-royal-plum/20">
        {match}
      </mark>
      <span>{after}</span>
    </div>
  )
}

/** Raw quote inspection dialog: quarantined vendor text with the evidence highlighted. */
export function QuoteRawTextDialog({
  open,
  onOpenChange,
  rawText,
  highlightAnchor,
}: QuoteRawTextDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-warm-ivory border-royal-plum/10 text-royal-plum">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold">Raw Vendor Quote Text</DialogTitle>
          <DialogDescription className="text-xs text-royal-plum/70">
            Quarantined vendor text. Yellow highlight indicates verbatim evidence for the selected
            item.
          </DialogDescription>
        </DialogHeader>

        <HighlightedRawText rawText={rawText} highlightAnchor={highlightAnchor} />
      </DialogContent>
    </Dialog>
  )
}
