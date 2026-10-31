import type { EnvironmentalAnalysis, EnvironmentalRiskAdvisory, EventType } from './types'

const NORTH_CENTRAL_HEAT_CITIES = [
  'delhi',
  'new delhi',
  'delhi ncr',
  'ncr',
  'jaipur',
  'jodhpur',
  'udaipur',
  'lucknow',
  'ahmedabad',
  'chandigarh',
  'gurgaon',
  'noida',
]

const WEST_COAST_MONSOON_CITIES = [
  'mumbai',
  'goa',
  'kochi',
  'kerala',
  'pune',
  'western ghats',
  'alibaug',
  'lonavala',
]

/**
 * Pure UTC environmental risk detector for Indian celebrations.
 * Parses eventDateStr strictly via split('-') into integer year, month, day
 * to prevent timezone-shift artifacts.
 *
 * Rules:
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
  const [yStr, mStr, dStr] = eventDateStr.split('-')
  const _year = parseInt(yStr, 10)
  const month = parseInt(mStr, 10) - 1 // 0-indexed: 0 = Jan, ..., 11 = Dec
  const day = parseInt(dStr, 10)

  const normCity = city.toLowerCase().trim()
  const detectedRisks: EnvironmentalRiskAdvisory[] = []

  // 1. Peak Winter Saya Season (Nov 1 - Feb 28/29) - Weddings only
  const isWinterSayaMonth = month === 10 || month === 11 || month === 0 || month === 1
  if (isWinterSayaMonth && eventType === 'wedding') {
    detectedRisks.push({
      id: 'peak_saya_winter',
      title: 'Peak Winter Saya Season',
      severity: 'advisory',
      description:
        'Auspicious winter wedding dates across India experience intense booking competition for premier venues and cinematographers.',
      affectedCategories: ['venue', 'photo_film'],
      leadTimeBufferDays: 30,
      recommendation:
        'High celebration density. Book venues and photography teams 7-8 months in advance.',
    })
  }

  // 2. Peak Summer Saya Season (Apr 15 - May 31) - Weddings only
  const isSummerSayaWindow = (month === 3 && day >= 15) || month === 4
  if (isSummerSayaWindow && eventType === 'wedding') {
    detectedRisks.push({
      id: 'peak_saya_summer',
      title: 'Peak Summer Saya Season',
      severity: 'advisory',
      description:
        'Auspicious summer wedding dates create high demand for climate-controlled banquet halls and indoor mandaps.',
      affectedCategories: ['venue'],
      leadTimeBufferDays: 15,
      recommendation:
        'High demand for air-conditioned banquet spaces. Book venues 6+ months in advance.',
    })
  }

  // 3. Monsoon Outdoor Hazard (Jun 15 - Aug 31 pan-India, extended to Sep 15 on West Coast)
  const isWestCoast = WEST_COAST_MONSOON_CITIES.some((c) => normCity.includes(c))
  const isMonsoonPanIndia = (month === 5 && day >= 15) || month === 6 || month === 7
  const isMonsoonWestCoastExtended = isWestCoast && month === 8 && day <= 15
  if (isMonsoonPanIndia || isMonsoonWestCoastExtended) {
    detectedRisks.push({
      id: 'monsoon_outdoor',
      title: 'Monsoon Weather Hazard',
      severity: 'warning',
      description:
        'High rainfall hazard detected for outdoor lawns and open-air mandaps during the monsoon season.',
      affectedCategories: ['venue', 'decor'],
      recommendation:
        'High rainfall hazard. Secure covered backups, waterproof shamiana staging, and raised electrical platforms.',
    })
  }

  // 4. Extreme Summer Heat (May 1 - Jun 30 in North/Central India)
  const isNorthCentral = NORTH_CENTRAL_HEAT_CITIES.some((c) => normCity.includes(c))
  const isSummerHeatWindow = month === 4 || month === 5
  if (isSummerHeatWindow && isNorthCentral) {
    detectedRisks.push({
      id: 'extreme_summer_heat',
      title: 'Extreme Summer Heat Advisory',
      severity: 'advisory',
      description:
        'Daytime temperatures frequently exceed 40°C in North and Central India during May and June.',
      affectedCategories: ['catering', 'venue', 'decor'],
      recommendation:
        'High temperatures (>40°C). Schedule ceremonies post-sunset, provide misting systems and chilled hydration counters.',
    })
  }

  // 5. Holiday & Dry Day Clash (Jan 26, Aug 15, Oct 2, Dec 31)
  const isRepublicDay = month === 0 && day === 26
  const isIndependenceDay = month === 7 && day === 15
  const isGandhiJayanti = month === 9 && day === 2
  const isNewYearsEve = month === 11 && day === 31
  if (isRepublicDay || isIndependenceDay || isGandhiJayanti || isNewYearsEve) {
    const holidayName = isRepublicDay
      ? 'Republic Day'
      : isIndependenceDay
        ? 'Independence Day'
        : isGandhiJayanti
          ? 'Gandhi Jayanti'
          : "New Year's Eve"

    detectedRisks.push({
      id: 'holiday_clash',
      title: `National Holiday / Civic Advisory (${holidayName})`,
      severity: 'warning',
      description: `${holidayName} involves strict civic regulations, dry day alcohol rules, and rigid 10:00 PM sound curfews.`,
      affectedCategories: ['entertainment', 'venue'],
      recommendation:
        'Dry day regulations and strict 10 PM outdoor sound curfews apply. Plan indoor transitions and advance permits.',
    })
  }

  const isPeakSayaSeason = detectedRisks.some(
    (r) => r.id === 'peak_saya_winter' || r.id === 'peak_saya_summer'
  )
  const hasWeatherHazards = detectedRisks.some(
    (r) => r.id === 'monsoon_outdoor' || r.id === 'extreme_summer_heat'
  )
  const hasHolidayClash = detectedRisks.some((r) => r.id === 'holiday_clash')

  // Generate calm, reassuring festive summaries (ADR-0005)
  let seasonalSummaryTitle = 'Favorable Celebration Window'
  let seasonalSummaryText =
    'No major seasonal weather hazards or peak booking congestion detected for this date.'

  if (isPeakSayaSeason && hasWeatherHazards) {
    seasonalSummaryTitle = 'Peak Saya Season & Seasonal Weather Notice'
    seasonalSummaryText =
      'High celebration density along with seasonal weather conditions detected. Lead-time buffers and covered backup plans are active.'
  } else if (isPeakSayaSeason) {
    seasonalSummaryTitle = 'Peak Saya Celebration Season'
    seasonalSummaryText =
      'High celebration density detected for your date. Key vendors and venues book early, so dynamic planning buffers have been added to your timeline.'
  } else if (hasWeatherHazards) {
    seasonalSummaryTitle = 'Seasonal Weather Awareness'
    seasonalSummaryText =
      'Seasonal weather conditions detected. Covered staging, climate control, and hydration provisions are recommended.'
  } else if (hasHolidayClash) {
    seasonalSummaryTitle = 'Holiday & Civic Advisory'
    seasonalSummaryText =
      'National holiday or dry day clash detected. Special sound curfew and logistics permits apply.'
  }

  return {
    detectedRisks,
    isPeakSayaSeason,
    hasWeatherHazards,
    hasHolidayClash,
    seasonalSummaryTitle,
    seasonalSummaryText,
  }
}
