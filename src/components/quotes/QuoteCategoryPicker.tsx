import React from 'react'
import type { BudgetCategory } from '@/lib/engine/types'
import { cn } from '@/lib/utils'
import { INTAKE_CATEGORIES } from './quoteIntakeCategories'

interface QuoteCategoryPickerProps {
  category: BudgetCategory
  onSelect: (category: BudgetCategory) => void
}

/** Vendor category switcher for the intake form. */
export function QuoteCategoryPicker({ category, onSelect }: QuoteCategoryPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        id="vendor-category-label"
        className="text-xs font-semibold text-royal-plum/80 uppercase tracking-wider font-mono"
      >
        Vendor Category
      </span>
      <div
        role="group"
        aria-labelledby="vendor-category-label"
        className="flex flex-wrap items-center gap-1.5"
      >
        {INTAKE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              category === cat.id
                ? 'bg-marigold text-royal-plum border-royal-plum/30 font-semibold shadow-2xs'
                : 'bg-white text-royal-plum/70 border-royal-plum/10 hover:border-royal-plum/25 hover:text-royal-plum'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
