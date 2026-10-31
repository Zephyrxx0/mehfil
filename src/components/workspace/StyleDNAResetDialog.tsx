import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface StyleDNAResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Two-Stage Confirmation Dialog for Reset to Baseline (v1) (D-11, T-04-08) */
export function StyleDNAResetDialog({ open, onOpenChange, onConfirm }: StyleDNAResetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-lg font-bold text-royal-plum">
            Reset to Baseline (v1)?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-royal-plum/70 leading-relaxed">
            Reset celebration plan to baseline archetype? All custom vibe multipliers will be
            reverted to default weights. Your current plan remains safely saved in version history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs font-semibold text-royal-plum">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-terracotta text-white hover:bg-terracotta/90 text-xs font-semibold"
          >
            Reset to Baseline
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
