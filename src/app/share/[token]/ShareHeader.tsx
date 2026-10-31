import * as React from 'react'
import { Wordmark } from '@/components/brand/Wordmark'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { countdownLabel } from './share-view-format'

export interface ShareHeaderProps {
  title: string
  formattedEventDate: string
  city: string
  guestCount: number
  daysRemaining: number
}

/** Top wordmark, plan title, key facts and the event countdown banner. */
export function ShareHeader({
  title,
  formattedEventDate,
  city,
  guestCount,
  daysRemaining,
}: ShareHeaderProps) {
  return (
    <header className="flex flex-col items-center text-center space-y-4">
      <div className="flex items-center gap-2">
        <Wordmark size="lg" hideTag />
        <span className="text-xs uppercase tracking-widest text-royal-plum/70 font-medium">
          • Celebration
        </span>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-royal-plum max-w-2xl leading-tight">
        {title}
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium text-royal-plum/80 pt-1">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-royal-plum/70" />
          <span>{formattedEventDate}</span>
        </span>
        <span className="text-royal-plum/30">•</span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-royal-plum/70" />
          <span>{city}</span>
        </span>
        <span className="text-royal-plum/30">•</span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-royal-plum/70" />
          <span>{guestCount} Celebrated Guests</span>
        </span>
      </div>

      {/* Event Countdown Banner */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-marigold/40 bg-marigold/20 px-5 py-2 text-sm font-semibold text-royal-plum shadow-2xs">
          <Clock className="h-4 w-4 text-royal-plum/70" />
          <span>{countdownLabel(daysRemaining)}</span>
        </div>
      </div>
    </header>
  )
}
