'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MAX_DESCRIPTION_LENGTH, VIBE_MAX, VIBE_MIN } from '@/lib/vibe-limits'

export interface VibeSuggestionResult {
  swatchIds: string[]
  reasoning: string
  source: 'ai' | 'heuristic'
}

interface DescribeVibeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuggested: (result: VibeSuggestionResult) => void
}

const EXAMPLES = [
  'Warm candlelit courtyard, marigold and brass, family close by',
  'Modern and minimal, lots of white flowers, a quiet cocktail evening',
  'Loud, colourful and full of dancing, like a village mela',
]

/**
 * Asks for a few words about the celebration and has the server pick a handful of
 * matching references from the catalogue. The caller decides what to do with
 * the result.
 */
export function DescribeVibeDialog({ open, onOpenChange, onSuggested }: DescribeVibeDialogProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Cancel any request in flight when the dialog closes or unmounts.
  useEffect(() => {
    if (!open) abortRef.current?.abort()
    return () => abortRef.current?.abort()
  }, [open])

  const canSubmit = text.trim().length >= 3 && !loading

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/vibes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim() }),
        signal: controller.signal,
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Could not find vibes just now')
      }
      onSuggested(json.data as VibeSuggestionResult)
      setText('')
      onOpenChange(false)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Could not find vibes just now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Describe your vibe</DialogTitle>
          <DialogDescription>
            Write a few words about how the celebration should look and feel. We will pick {VIBE_MIN} to {VIBE_MAX} matching
            references for you. You can still change them afterwards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label htmlFor="vibe-description" className="sr-only">
            Describe your vibe
          </label>
          <textarea
            id="vibe-description"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
            rows={4}
            autoFocus
            placeholder="e.g. Warm candlelit courtyard, marigold and brass, family close by"
            className="w-full resize-none rounded-xl border border-royal-plum/15 bg-white/80 p-3.5 text-sm text-royal-plum placeholder:text-royal-plum/40 focus:border-royal-plum focus:outline-none focus:ring-1 focus:ring-royal-plum"
          />
          <div className="flex flex-wrap gap-1.5" aria-label="Examples">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                className="rounded-full border border-royal-plum/15 bg-white/60 px-3 py-1 text-left text-xs text-royal-plum/75 transition hover:border-royal-plum/30 hover:text-royal-plum"
              >
                {example}
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs tabular-nums text-royal-plum/50">
              {text.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Finding vibes...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Find my vibes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
