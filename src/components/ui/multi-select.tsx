'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface MultiSelectProps {
  /** Selectable options. */
  options: readonly string[]
  /** Selected options. An empty array means "no filter" and shows `allLabel`. */
  value: readonly string[]
  onChange: (value: string[]) => void
  /** Shown when nothing is selected. */
  allLabel?: string
  /** Optional count shown after each option, keyed by option. */
  counts?: Readonly<Record<string, number>>
  'aria-label'?: string
  className?: string
}

/**
 * Dropdown with tick-boxes. The menu stays open while ticking so several
 * options can be picked in one go; "all" is simply nothing ticked.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  allLabel = 'All',
  counts,
  'aria-label': ariaLabel,
  className,
}: MultiSelectProps) {
  const label =
    value.length === 0 ? allLabel : value.length === 1 ? value[0] : `${value.length} categories`

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 text-left text-sm font-medium text-royal-plum transition',
            'hover:border-royal-plum/30 focus-visible:border-royal-plum focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-royal-plum',
            'data-[state=open]:border-royal-plum data-[state=open]:ring-1 data-[state=open]:ring-royal-plum',
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-royal-plum/60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56">
        <DropdownMenuCheckboxItem
          checked={value.length === 0}
          onSelect={(e) => {
            e.preventDefault()
            onChange([])
          }}
        >
          {allLabel}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={value.includes(option)}
            onSelect={(e) => {
              e.preventDefault()
              toggle(option)
            }}
          >
            <span className="flex-1">{option}</span>
            {counts && (
              <span className="ml-3 text-xs tabular-nums text-royal-plum/45">{counts[option] ?? 0}</span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
