import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import Link from 'next/link'

/** Shown when the plan is not found or its token has been invalidated/expired (D-08, 03-UI-SPEC.md §4) */
export function ShareExpiredView() {
  return (
    <main className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-5 rounded-3xl border border-royal-plum/10 bg-white/60 p-8 sm:p-10 shadow-xl backdrop-blur-sm">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center">
          <Clock className="h-7 w-7 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-royal-plum">
            Celebration Link Expired
          </h1>
          <p className="text-sm text-royal-plum/70 leading-relaxed">
            The celebration organizer has refreshed this link or concluded the planning phase.
            Please request an updated share link from the family host.
          </p>
        </div>

        <div className="pt-2">
          <Button asChild className="bg-royal-plum text-warm-ivory hover:bg-royal-plum/90">
            <Link href="/">Return to Mehfil Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
