import React from 'react'
import Link from 'next/link'
import { HairlineFigure } from '@/components/hairline/HairlineFigure'
import { Rangoli } from '@/components/rangoli/Rangoli'
import { Firework } from '@/components/fireworks/Firework'
import { TitleDraw } from './TitleDraw'
import { Button } from '@/components/ui/button'

/**
 * The landing page does nothing by itself: a title, one sentence, and two
 * links into the app. The line art behind it answers the pointer.
 */
export function HeroSection() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Centrepiece rangoli, behind the title */}
      <div className="pointer-events-none absolute inset-0 -z-20 flex items-center justify-center">
        <Rangoli className="w-[min(125vw,880px,98dvh)] max-w-none" />
      </div>

      {/* Fireworks: each type in its own marked area (positions are a share of a 1734 x 928 viewport) */}
      <Firework
        type="peony"
        seconds={5}
        offset={1}
        className="absolute left-[27.2%] top-[1.2%] -z-10 hidden w-[6vw] sm:block"
      />
      <Firework
        type="willow"
        seconds={7}
        offset={3}
        className="absolute left-[2.1%] top-[33%] -z-10 hidden w-[14.1vw] sm:block"
      />
      <Firework
        type="ring"
        seconds={6}
        offset={0}
        className="absolute right-[3%] top-[3%] -z-10 w-[30vw] sm:left-[85.7%] sm:right-auto sm:top-[32.6%] sm:w-[8.7vw]"
      />
      <Firework
        type="palm"
        seconds={8}
        offset={5}
        className="absolute left-[80.3%] top-[68%] -z-10 hidden w-[17.1vw] sm:block"
      />
      <Firework
        type="chakri"
        seconds={3}
        offset={1.5}
        className="absolute bottom-[3%] left-[2%] -z-10 w-[30vw] sm:bottom-auto sm:left-[2.9%] sm:top-[85.3%] sm:w-[6.1vw]"
      />

      {/* Line art, kept to the edges so it never sits under the text or links. */}
      <HairlineFigure
        name="bangles"
        className="absolute -left-[6%] top-[2%] -z-10 w-[58vw] max-w-[360px] sm:left-[3%] sm:top-[2%] sm:w-[26vw] lg:w-[21vw]"
      />
      <HairlineFigure
        name="laddoos"
        className="absolute -right-[10%] top-[40%] -z-10 hidden w-[46vw] max-w-[420px] sm:right-[2%] sm:top-[-2%] sm:block sm:w-[28vw] lg:w-[22vw]"
      />
      <HairlineFigure
        name="diyas"
        className="absolute -bottom-[2%] right-[-14%] -z-10 w-[84vw] max-w-[560px] sm:bottom-[0%] sm:left-[3%] sm:right-auto sm:w-[40vw]"
      />

      <div className="flex w-full max-w-[1080px] flex-col items-center text-center">
        <TitleDraw className="w-full" />

        <p className="mt-8 max-w-md text-balance text-base leading-relaxed text-royal-plum/80 [text-shadow:0_0_6px_hsl(var(--background)),0_0_14px_hsl(var(--background))] sm:text-lg">
          One plan for the budget, the timeline and the people. Change one thing and the rest rebalances.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button asChild size="hero" className="rounded-full">
            <Link href="/new">Start planning</Link>
          </Button>
          <Button asChild size="hero" variant="outline" className="rounded-full bg-warm-ivory">
            <Link href="/new?starter=wedding">See a sample plan</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
