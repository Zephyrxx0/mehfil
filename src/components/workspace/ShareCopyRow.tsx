import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

interface ShareCopyRowProps {
  /** Id shared by the input and its label. */
  id: string
  label: string
  value: string
  copied: boolean
  copyLabel: string
  onCopy: () => void
}

/** Labelled read-only URL field with a copy button that flips to "Copied!" for a moment. */
export function ShareCopyRow({ id, label, value, copied, copyLabel, onCopy }: ShareCopyRowProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-royal-plum/80">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          readOnly
          value={value}
          className="w-full rounded-xl border border-royal-plum/15 bg-white/70 px-3.5 py-2 text-xs font-mono text-royal-plum select-all focus:outline-hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onCopy}
          className="shrink-0 gap-1.5 text-xs font-semibold"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#4A7C59]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>{copyLabel}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
