import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { NumberStepper } from '@/components/ui/number-stepper'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import { toISODate } from '@/lib/dates'

afterEach(() => vi.useRealTimers())

function Stepper(props: { initial?: number; min?: number; max?: number; step?: number }) {
  const [v, setV] = useState(props.initial ?? 300)
  return (
    <NumberStepper
      aria-label="Guests"
      value={v}
      onChange={setV}
      min={props.min}
      max={props.max}
      step={props.step}
    />
  )
}

describe('NumberStepper', () => {
  it('steps up and down with the themed buttons', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={300} min={10} max={5000} step={10} />)
    const input = screen.getByRole('textbox', { name: 'Guests' })
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(input).toHaveValue('310')
    await user.click(screen.getByRole('button', { name: 'Decrease' }))
    await user.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(input).toHaveValue('290')
  })

  it('disables a button at its limit and never goes past it', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={15} min={10} max={20} step={10} />)
    await user.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(screen.getByRole('textbox', { name: 'Guests' })).toHaveValue('10')
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(screen.getByRole('textbox', { name: 'Guests' })).toHaveValue('20')
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
  })

  it('accepts typing, strips non-digits, clamps to the range and supports arrow keys', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={300} min={10} max={5000} />)
    const input = screen.getByRole('textbox', { name: 'Guests' })
    await user.clear(input)
    await user.type(input, '12ab0')
    expect(input).toHaveValue('120')
    await user.clear(input)
    await user.type(input, '99999')
    await user.tab()
    expect(input).toHaveValue('5000')
    input.focus()
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveValue('4999')
  })

  it('falls back to the minimum when left empty', async () => {
    const user = userEvent.setup()
    render(<Stepper initial={300} min={10} />)
    const input = screen.getByRole('textbox', { name: 'Guests' })
    await user.clear(input)
    await user.tab()
    expect(input).toHaveValue('10')
  })
})

describe('DatePicker', () => {
  // 29 Oct 2026, local midday. Only Date is faked so Radix and user-event timers keep working.
  const fakeToday = () => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 29, 12, 0) })

  function Picker(props: { initial: string; onChange?: (v: string) => void }) {
    const [v, setV] = useState(props.initial)
    return (
      <DatePicker
        aria-label="Date"
        value={v}
        onChange={(n) => {
          setV(n)
          props.onChange?.(n)
        }}
      />
    )
  }

  it('shows the chosen date in a readable form', () => {
    fakeToday()
    render(<Picker initial="2026-11-20" />)
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent(/20/)
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent(/2026/)
  })

  it('disables every day before today and lets the user pick today or later', async () => {
    fakeToday()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Picker initial="2026-10-29" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Date' }))

    const grid = await screen.findByRole('grid')
    const day = (n: number) =>
      within(grid).getByRole('button', { name: new RegExp(`October ${n}(st|nd|rd|th), 2026`) })

    expect(day(28)).toBeDisabled()
    expect(day(1)).toBeDisabled()
    expect(day(29)).toBeEnabled()
    expect(day(31)).toBeEnabled()

    await user.click(day(28))
    expect(onChange).not.toHaveBeenCalled()

    await user.click(day(31))
    expect(onChange).toHaveBeenCalledWith(toISODate(new Date(2026, 9, 31)))
  })

  it('cannot page back to a month that has already ended', async () => {
    fakeToday()
    const user = userEvent.setup()
    render(<Picker initial="2026-10-29" />)
    await user.click(screen.getByRole('button', { name: 'Date' }))
    await screen.findByRole('grid')
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('opens on the current month when the stored date has already passed', async () => {
    fakeToday()
    const user = userEvent.setup()
    render(<Picker initial="2026-06-15" />)
    await user.click(screen.getByRole('button', { name: 'Date' }))
    const grid = await screen.findByRole('grid')
    expect(
      within(grid).getByRole('button', { name: /October 29(st|nd|rd|th), 2026/ })
    ).toBeEnabled()
  })
})

describe('MultiSelect', () => {
  function Select({ onChange }: { onChange?: (v: string[]) => void }) {
    const [v, setV] = useState<string[]>([])
    return (
      <MultiSelect
        aria-label="Category"
        options={['A', 'B', 'C']}
        value={v}
        counts={{ A: 1, B: 2, C: 3 }}
        allLabel="Everything"
        onChange={(n) => {
          setV(n)
          onChange?.(n)
        }}
      />
    )
  }

  it('shows the all label, a single name, then a count', async () => {
    const user = userEvent.setup()
    render(<Select />)
    const trigger = () => screen.getByRole('button', { name: 'Category', hidden: true })
    expect(trigger()).toHaveTextContent('Everything')

    await user.click(trigger())
    await user.click(await screen.findByRole('menuitemcheckbox', { name: /^A/ }))
    expect(trigger()).toHaveTextContent('A')
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^C/ }))
    expect(trigger()).toHaveTextContent('2 categories')
  })

  it('toggles an option off again and clears with the all option; shows counts', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Select onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Category' }))
    const b = await screen.findByRole('menuitemcheckbox', { name: /^B/ })
    expect(b).toHaveTextContent('2')
    await user.click(b)
    await user.click(b)
    expect(onChange).toHaveBeenLastCalledWith([])
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^A/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Everything' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })
})
