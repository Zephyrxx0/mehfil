import * as React from 'react'
import { Heart } from 'lucide-react'

export interface ShareProtectedMomentProps {
  name: string
}

/** Cherished Priority Card (Gulabi Rose Protected Moment) */
export function ShareProtectedMoment({ name }: ShareProtectedMomentProps) {
  return (
    <section
      aria-labelledby="protected-moment-heading"
      className="rounded-3xl border border-gulabi-rose/40 bg-gulabi-rose/15 p-6 sm:p-8 flex flex-col gap-3 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gulabi-rose bg-gulabi-rose/30 px-3 py-0.5 text-2xs uppercase tracking-wider font-bold text-royal-plum">
          <Heart className="h-3 w-3 fill-royal-plum text-royal-plum" />
          Cherished Priority
        </span>
      </div>

      <h2 id="protected-moment-heading" className="font-serif text-2xl font-bold text-royal-plum">
        {name}
      </h2>

      <p className="text-sm text-royal-plum/80 leading-relaxed max-w-xl">
        The family has designated this ceremony as an uncompromising celebration priority,
        guaranteeing mathematical allocation protection throughout planning.
      </p>
    </section>
  )
}
