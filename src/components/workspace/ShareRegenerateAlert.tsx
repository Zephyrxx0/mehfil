import * as React from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface ShareRegenerateAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Confirmation dialog before replacing the share key (old links stop working). */
export function ShareRegenerateAlert({ open, onOpenChange, onConfirm }: ShareRegenerateAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Invalidate Old Link & Create New?</AlertDialogTitle>
          <AlertDialogDescription>
            Anyone with the previous link will immediately lose access and see an expired
            celebration screen. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Current Link</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-terracotta text-white hover:bg-terracotta/90"
          >
            Invalidate & Regenerate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
