import { ENVIRONMENTAL_RULES, type RiskContext } from './environmental-rules'
import type { EnvironmentalAnalysis, EventType } from './types'

interface SeasonalFlags {
  isPeakSayaSeason: boolean
  hasWeatherHazards: boolean
  hasHolidayClash: boolean
}

interface SeasonalSummary {
  title: string
  text: string
}

/**
 * Calm, reassuring festive summaries (ADR-0005). First matching entry wins;
 * the last entry is the unconditional default.
 */
const SEASONAL_SUMMARIES: Array<{ when: (f: SeasonalFlags) => boolean } & SeasonalSummary> = [
  {
    when: (f) => f.isPeakSayaSeason && f.hasWeatherHazards,
    title: 'Peak Saya Season & Seasonal Weather Notice',
    text: 'High celebration density along with seasonal weather conditions detected. Lead-time buffers and covered backup plans are active.',
  },
  {
    when: (f) => f.isPeakSayaSeason,
    title: 'Peak Saya Celebration Season',
    text: 'High celebration density detected for your date. Key vendors and venues book early, so dynamic planning buffers have been added to your timeline.',
  },
  {
    when: (f) => f.hasWeatherHazards,
    title: 'Seasonal Weather Awareness',
    text: 'Seasonal weather conditions detected. Covered staging, climate control, and hydration provisions are recommended.',
  },
  {
    when: (f) => f.hasHolidayClash,
    title: 'Holiday & Civic Advisory',
    text: 'National holiday or dry day clash detected. Special sound curfew and logistics permits apply.',
  },
  {
    when: () => true,
    title: 'Favorable Celebration Window',
    text: 'No major seasonal weather hazards or peak booking congestion detected for this date.',
  },
]

function summarize(flags: SeasonalFlags): SeasonalSummary {
  const match = SEASONAL_SUMMARIES.find((s) => s.when(flags))
  // The final entry always matches; the fallback satisfies the type checker.
  return match ?? SEASONAL_SUMMARIES[SEASONAL_SUMMARIES.length - 1]
}

/**
 * Pure UTC environmental risk detector for Indian celebrations.
 * Parses eventDateStr strictly via split('-') into integer month and day
 * to prevent timezone-shift artifacts.
 *
 * Rules live in `environmental-rules.ts` (ENVIRONMENTAL_RULES):
 * - Peak Winter Saya: Nov 1 – Feb 28/29 (Weddings only, +30d buffer on Venue & Photo)
 * - Peak Summer Saya: Apr 15 – May 31 (Weddings only, +15d buffer on Venue)
 * - Monsoon Outdoor Hazard: Jun 15 – Aug 31 pan-India, extended to Sep 15 on West Coast
 * - Extreme Summer Heat: May 1 – Jun 30 in North & Central India
 * - Holiday / Dry Day Clash: Jan 26, Aug 15, Oct 2, Dec 31
 */
export function detectEnvironmentalRisks(
  eventDateStr: string,
  city: string,
  eventType: EventType
): EnvironmentalAnalysis {
  // Pure string split to avoid browser local timezone skew
  const [, mStr, dStr] = eventDateStr.split('-')
  const ctx: RiskContext = {
    month: parseInt(mStr, 10) - 1, // 0-indexed: 0 = Jan, ..., 11 = Dec
    day: parseInt(dStr, 10),
    normCity: city.toLowerCase().trim(),
    eventType,
  }

  const detectedRisks = ENVIRONMENTAL_RULES.filter((r) => r.applies(ctx)).map((r) => r.build(ctx))
  const ids = new Set(detectedRisks.map((r) => r.id))

  const flags: SeasonalFlags = {
    isPeakSayaSeason: ids.has('peak_saya_winter') || ids.has('peak_saya_summer'),
    hasWeatherHazards: ids.has('monsoon_outdoor') || ids.has('extreme_summer_heat'),
    hasHolidayClash: ids.has('holiday_clash'),
  }
  const { title, text } = summarize(flags)

  return {
    detectedRisks,
    ...flags,
    seasonalSummaryTitle: title,
    seasonalSummaryText: text,
  }
}
