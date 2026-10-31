'use client'

import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDisplayDate, parseISODate, todayISO, toISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  /** `YYYY-MM-DD`. */
  value: string
  onChange: (value: string) => void
  /** Earliest selectable day as `YYYY-MM-DD`. Defaults to today; earlier days are disabled. */
  min?: string
  id?: string
  className?: string
  'aria-label'?: string
}

/**
 * Date field that opens a themed month grid in a popover. Days before `min`
 * (today by default) cannot be picked, and the grid cannot page back to a
 * month that has no selectable day.
 */
export function DatePicker({
  value,
  onChange,
  min,
  id,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const minISO = min ?? todayISO()
  const minDate = parseISODate(minISO) as Date
  const selected = parseISODate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-royal-plum/15 bg-white/80 px-3.5 text-left text-sm text-royal-plum transition',
            'hover:border-royal-plum/30 focus-visible:border-royal-plum focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-royal-plum',
            'data-[state=open]:border-royal-plum data-[state=open]:ring-1 data-[state=open]:ring-royal-plum',
            className
          )}
        >
          <span className={cn('tabular-nums', !selected && 'text-royal-plum/40')}>
            {selected ? formatDisplayDate(value) : 'Pick a date'}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-royal-plum/60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected && value >= minISO ? selected : minDate}
          startMonth={minDate}
          disabled={{ before: minDate }}
          onSelect={(date) => {
            if (!date) return
            const next = toISODate(date)
            if (next < minISO) return
            onChange(next)
            setOpen(false)
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- opened by a user action; focus must land here
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
