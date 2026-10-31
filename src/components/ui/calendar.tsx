'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames, type DayButton } from 'react-day-picker'
import { cn } from '@/lib/utils'

/**
 * Month grid in Mehfil's palette: plum ink on ivory, a marigold selected day,
 * a rose ring for today, and struck-through muted days for anything disabled.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames()

  const navButton =
    'inline-flex h-8 w-8 items-center justify-center rounded-full text-royal-plum transition hover:bg-royal-plum/8 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum aria-disabled:pointer-events-none aria-disabled:opacity-30 disabled:pointer-events-none disabled:opacity-30'

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-1 [--cell-size:2.5rem]', className)}
      classNames={{
        root: cn('w-fit text-royal-plum', defaults.root),
        months: cn('relative flex flex-col gap-4', defaults.months),
        month: cn('flex w-full flex-col gap-3', defaults.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between', defaults.nav),
        button_previous: cn(navButton, defaults.button_previous),
        button_next: cn(navButton, defaults.button_next),
        month_caption: cn('flex h-8 items-center justify-center', defaults.month_caption),
        caption_label: cn(
          'font-serif text-base font-semibold text-royal-plum',
          defaults.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaults.month_grid),
        weekdays: cn('flex', defaults.weekdays),
        weekday: cn(
          'flex-1 select-none text-center text-2xs font-semibold uppercase tracking-wider text-royal-plum/70',
          defaults.weekday
        ),
        week: cn('mt-1 flex w-full', defaults.week),
        day: cn('group/day relative flex-1 select-none p-0 text-center', defaults.day),
        today: cn('', defaults.today),
        outside: cn('text-royal-plum/30', defaults.outside),
        disabled: cn('', defaults.disabled),
        hidden: cn('invisible', defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c, ...rest }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('h-4 w-4', c)} {...rest} />
          ) : (
            <ChevronRight className={cn('h-4 w-4', c)} {...rest} />
          ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected={modifiers.selected || undefined}
      data-today={modifiers.today || undefined}
      className={cn(
        'mx-auto flex h-[--cell-size] w-[--cell-size] items-center justify-center rounded-full text-sm font-medium tabular-nums text-royal-plum transition',
        'hover:bg-royal-plum/8 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum',
        'data-[today]:ring-1 data-[today]:ring-gulabi-rose',
        'data-[selected]:bg-marigold data-[selected]:font-semibold data-[selected]:shadow-[0_4px_14px_-4px_rgba(247,200,115,0.7)] data-[selected]:hover:bg-marigold',
        'disabled:pointer-events-none disabled:text-royal-plum/25 disabled:line-through',
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
