'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

/** An opener is only worth returning to if it is a real element (not the page body). */
function isRestorableOpener(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element !== document.body &&
    element !== document.documentElement
  )
}

function isDisabled(element: HTMLElement): boolean {
  return (
    (element as HTMLButtonElement).disabled === true ||
    element.getAttribute('aria-disabled') === 'true'
  )
}

/**
 * Returns focus to the element that opened a Radix Dialog-based overlay.
 *
 * Radix only restores focus to its own `Trigger`. Overlays opened from
 * a separate `onClick` + `open` state have no Trigger, so focus would fall to
 * `<body>` on close (WCAG 2.4.3).
 *
 * The returned `ref` must be attached to the Radix `Content`. React calls ref
 * callbacks in the commit's layout phase, before the passive effect in which
 * Radix's FocusScope moves focus into the content. At that moment
 * `document.activeElement` is still the opener. The returned
 * `onCloseAutoFocus` composes with the caller's handler: a caller that calls
 * `preventDefault()` keeps full control, and when no usable opener was recorded
 * Radix's default (Trigger) behaviour is untouched.
 */
export function useReturnFocusToOpener<T extends HTMLElement>(
  forwardedRef: React.ForwardedRef<T>,
  onCloseAutoFocus?: (event: Event) => void
) {
  const openerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<T | null>(null)

  const ref = React.useCallback(
    (node: T | null) => {
      contentRef.current = node
      // Skip re-attachments after focus has already moved into the content.
      if (node && !node.contains(document.activeElement)) {
        const active = document.activeElement
        openerRef.current = isRestorableOpener(active) ? active : null
      }
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef]
  )

  const handleCloseAutoFocus = React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event)
      // React StrictMode (dev) runs FocusScope's cleanup once while still open.
      if (contentRef.current?.isConnected) return

      const opener = openerRef.current
      openerRef.current = null
      if (event.defaultPrevented || !opener) return
      if (!opener.isConnected || isDisabled(opener)) return
      // Something else already took focus (e.g. a click outside a non-modal dialog).
      const active = document.activeElement
      if (active && active !== document.body && active !== opener) return

      event.preventDefault()
      opener.focus()
    },
    [onCloseAutoFocus]
  )

  return { ref, onCloseAutoFocus: handleCloseAutoFocus }
}

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-royal-plum/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onCloseAutoFocus, ...props }, forwardedRef) => {
  const returnFocus = useReturnFocusToOpener(forwardedRef, onCloseAutoFocus)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={returnFocus.ref}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:p-8',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 rounded-full p-1.5 text-royal-plum/70 hover:bg-royal-plum/5 hover:text-royal-plum transition-opacity focus:outline-hidden">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-2xl font-serif font-bold text-royal-plum', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-royal-plum/70 leading-relaxed', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName
