import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

type CloseAutoFocus = (event: Event) => void

function ControlledDialog({ onCloseAutoFocus }: { onCloseAutoFocus?: CloseAutoFocus }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open controlled</button>
      <button>Elsewhere</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
          <DialogTitle>Controlled dialog</DialogTitle>
          <DialogDescription>Opened without a trigger.</DialogDescription>
          <input aria-label="Inside field" />
        </DialogContent>
      </Dialog>
    </>
  )
}

async function openAndEscape(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  role: 'dialog' | 'alertdialog' = 'dialog'
) {
  const opener = screen.getByRole('button', { name })
  await user.click(opener)
  const dialog = await screen.findByRole(role)
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole(role)).not.toBeInTheDocument())
  return opener
}

describe('overlay focus return (WCAG 2.4.3)', () => {
  describe('Dialog', () => {
    it('returns focus to a separate opener button when there is no DialogTrigger', async () => {
      const user = userEvent.setup()
      render(<ControlledDialog />)
      const opener = await openAndEscape(user, 'Open controlled')
      await waitFor(() => expect(opener).toHaveFocus())
    })

    it('still returns focus to the DialogTrigger', async () => {
      const user = userEvent.setup()
      render(
        <Dialog>
          <DialogTrigger>Open with trigger</DialogTrigger>
          <DialogContent>
            <DialogTitle>Triggered dialog</DialogTitle>
            <DialogDescription>Has a trigger.</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      const opener = await openAndEscape(user, 'Open with trigger')
      await waitFor(() => expect(opener).toHaveFocus())
    })

    it('does not override a caller onCloseAutoFocus that calls preventDefault', async () => {
      const user = userEvent.setup()
      const handler = vi.fn((event: Event) => event.preventDefault())
      render(<ControlledDialog onCloseAutoFocus={handler} />)
      const opener = await openAndEscape(user, 'Open controlled')
      await waitFor(() => expect(handler).toHaveBeenCalledTimes(1))
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(opener).not.toHaveFocus()
    })

    it('still calls a caller onCloseAutoFocus that does not prevent default, then restores focus', async () => {
      const user = userEvent.setup()
      const handler = vi.fn()
      render(<ControlledDialog onCloseAutoFocus={handler} />)
      const opener = await openAndEscape(user, 'Open controlled')
      await waitFor(() => expect(opener).toHaveFocus())
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not focus an opener that was removed from the document', async () => {
      const user = userEvent.setup()
      function Disposable() {
        const [open, setOpen] = React.useState(false)
        const [shown, setShown] = React.useState(true)
        return (
          <>
            {shown && <button onClick={() => setOpen(true)}>Open disposable</button>}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>Disposable dialog</DialogTitle>
                <DialogDescription>Removes its opener.</DialogDescription>
                <button
                  onClick={() => {
                    setShown(false)
                    setOpen(false)
                  }}
                >
                  Remove opener and close
                </button>
              </DialogContent>
            </Dialog>
          </>
        )
      }
      render(<Disposable />)
      await user.click(screen.getByRole('button', { name: 'Open disposable' }))
      await user.click(await screen.findByRole('button', { name: 'Remove opener and close' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(document.activeElement).toBe(document.body)
    })

    it('restores focus under React StrictMode without stealing focus while open', async () => {
      const user = userEvent.setup()
      render(
        <React.StrictMode>
          <ControlledDialog />
        </React.StrictMode>
      )
      const opener = screen.getByRole('button', { name: 'Open controlled' })
      await user.click(opener)
      const dialog = await screen.findByRole('dialog')
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(dialog.contains(document.activeElement)).toBe(true)
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await waitFor(() => expect(opener).toHaveFocus())
    })
  })

  describe('AlertDialog', () => {
    it('returns focus to a separate opener button when there is no trigger', async () => {
      const user = userEvent.setup()
      function Controlled() {
        const [open, setOpen] = React.useState(false)
        return (
          <>
            <button onClick={() => setOpen(true)}>Open alert</button>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogContent>
                <AlertDialogTitle>Sure?</AlertDialogTitle>
                <AlertDialogDescription>This is a controlled alert.</AlertDialogDescription>
                <AlertDialogCancel>Keep</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )
      }
      render(<Controlled />)
      const opener = await openAndEscape(user, 'Open alert', 'alertdialog')
      await waitFor(() => expect(opener).toHaveFocus())
    })

    it('still returns focus to the AlertDialogTrigger', async () => {
      const user = userEvent.setup()
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open triggered alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Sure?</AlertDialogTitle>
            <AlertDialogDescription>Has a trigger.</AlertDialogDescription>
            <AlertDialogCancel>Keep</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )
      const opener = await openAndEscape(user, 'Open triggered alert', 'alertdialog')
      await waitFor(() => expect(opener).toHaveFocus())
    })
  })

  describe('Sheet', () => {
    it('returns focus to a separate opener button when there is no SheetTrigger', async () => {
      const user = userEvent.setup()
      function Controlled({ onCloseAutoFocus }: { onCloseAutoFocus?: CloseAutoFocus }) {
        const [open, setOpen] = React.useState(false)
        return (
          <>
            <button onClick={() => setOpen(true)}>Open sheet</button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetContent onCloseAutoFocus={onCloseAutoFocus}>
                <SheetTitle>Sheet</SheetTitle>
                <SheetDescription>Controlled sheet.</SheetDescription>
              </SheetContent>
            </Sheet>
          </>
        )
      }
      render(<Controlled />)
      const opener = await openAndEscape(user, 'Open sheet')
      await waitFor(() => expect(opener).toHaveFocus())
    })
  })
})
