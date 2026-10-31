import * as React from 'react'
import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Shown for any address that does not exist, with a way back to the app. */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-warm-ivory flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-5 rounded-3xl border border-royal-plum/10 bg-white/60 p-8 sm:p-10 shadow-xl backdrop-blur-sm">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-marigold/30 text-royal-plum flex items-center justify-center">
          <Compass className="h-7 w-7 stroke-[1.75]" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-royal-plum">Page Not Found</h1>
          <p className="text-sm text-royal-plum/70 leading-relaxed">
            We couldn’t find the page you were looking for. It may have moved, or the link may have
            a typo.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Button asChild>
            <Link href="/">Return to Mehfil Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/new">Plan a celebration</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
