import React from 'react'
import { Button } from '@/components/ui/button'

export interface StyleDNAHeaderProps {
  showEdit: boolean
  onEdit: () => void
}

export function StyleDNAHeader({ showEdit, onEdit }: StyleDNAHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2
          id="style-dna-heading"
          className="flex items-center gap-2.5 font-serif text-xl font-bold text-royal-plum"
        >
          <span
            aria-hidden="true"
            className="h-4 w-1 shrink-0 origin-bottom rounded-full bg-gradient-to-b from-marigold to-gulabi-rose motion-safe:animate-[mehfil-flourish_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
          />
          <span>Style DNA</span>
        </h2>
        <p className="mt-0.5 text-sm text-royal-plum/70">Aesthetic Identity</p>
      </div>

      {showEdit && (
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Edit Style DNA
        </Button>
      )}
    </div>
  )
}
