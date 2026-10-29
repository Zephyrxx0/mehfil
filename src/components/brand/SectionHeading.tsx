import React from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeadingProps {
  children: React.ReactNode
  /** Optional supporting line under the title. */
  description?: React.ReactNode
  /** Optional trailing content (actions, counts) aligned to the right. */
  action?: React.ReactNode
  /** Heading level for semantics; defaults to h2. */
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

/**
 * A section title with a small marigold flourish, so every section on the inner
 * pages shares the festive personality of the landing page. The flourish is a
 * short gradient rule that draws itself in (and holds still under reduced motion).
 */
export function SectionHeading({
  children,
  description,
  action,
  as: Tag = 'h2',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-2', className)}>
      <div className="min-w-0">
        <Tag className="flex items-center gap-2.5 font-serif text-lg font-bold leading-tight text-royal-plum sm:text-xl">
          <span
            aria-hidden="true"
            className="h-4 w-1 origin-bottom rounded-full bg-gradient-to-b from-marigold to-gulabi-rose motion-safe:animate-[mehfil-flourish_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
          />
          <span className="min-w-0">{children}</span>
        </Tag>
        {description && <p className="mt-1 pl-3.5 text-sm text-royal-plum/65">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
