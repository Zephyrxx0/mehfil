'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lock, KeyRound, Loader2 } from 'lucide-react'
import { capabilityStore } from '@/lib/storage/capability-store'

export interface UnlockEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  onUnlocked: () => void
}

export function UnlockEditDialog({
  open,
  onOpenChange,
  planId,
  onUnlocked,
}: UnlockEditDialogProps) {
  const [keyInput, setKeyInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyInput.trim()) return

    setIsLoading(true)
    setErrorMessage(null)

    // Normalize input: extract key if a full URL or query string was pasted
    let normalizedKey = keyInput.trim()
    if (normalizedKey.includes('key=')) {
      try {
        const urlObj = new URL(normalizedKey, 'https://mehfil.app')
        const extracted = urlObj.searchParams.get('key')
        if (extracted) normalizedKey = extracted
      } catch {
        // Fallback simple regex
        const match = normalizedKey.match(/key=([a-f0-9]+)/i)
        if (match) normalizedKey = match[1]
      }
    }

    try {
      const response = await fetch(`/api/plan/${planId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: normalizedKey }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.authorized) {
        capabilityStore.setEditKey(planId, normalizedKey)
        onUnlocked()
        onOpenChange(false)
      } else {
        setErrorMessage(
          'This edit key does not match this celebration. Please verify the URL or ask the host for an updated key.'
        )
      }
    } catch {
      setErrorMessage('Unable to verify key due to a network connection issue. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marigold/20 text-royal-plum mb-2">
            <Lock className="h-5 w-5" />
          </div>
          <DialogTitle className="font-serif text-2xl font-bold text-royal-plum">
            Enter Organizer Edit Key
          </DialogTitle>
          <DialogDescription className="text-sm text-royal-plum/70">
            Paste the 32-character edit key or capability URL shared by the celebration creator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label
              htmlFor="edit-key-input"
              className="text-xs font-semibold text-royal-plum/80 flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Organizer Capability Key</span>
            </label>
            <input
              id="edit-key-input"
              type="text"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="e.g. 7f9a2b... or full mehfil.app/plan/... URL"
              className="w-full rounded-xl border border-royal-plum/20 bg-white/70 px-3.5 py-2.5 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum focus:outline-hidden focus:ring-2 focus:ring-royal-plum/20"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- opened by a user action; focus must land here
              autoFocus
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-terracotta font-medium"
            >
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !keyInput.trim()}
              className="bg-royal-plum text-warm-ivory hover:bg-royal-plum/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Unlock Editing
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
