import type { EnvironmentalRiskAdvisory, EventType } from './types'

/**
 * Declarative environmental risk rules. Each rule pairs a pure predicate over the
 * parsed UTC date context with the advisory it produces. Table order is result order.
 */

/** Parsed date context. `month` is 0-indexed (0 = Jan, ..., 11 = Dec). */
export interface RiskContext {
  month: number
  day: number
  normCity: string
  eventType: EventType
}

export interface EnvironmentalRule {
  id: EnvironmentalRiskAdvisory['id']
  applies: (ctx: RiskContext) => boolean
  build: (ctx: RiskContext) => EnvironmentalRiskAdvisory
}

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

/** National holidays and dry days (0-indexed month). */
const HOLIDAYS = [
  { month: 0, day: 26, name: 'Republic Day' },
  { month: 7, day: 15, name: 'Independence Day' },
  { month: 9, day: 2, name: 'Gandhi Jayanti' },
  { month: 11, day: 31, name: "New Year's Eve" },
]

const cityMatches = (normCity: string, cities: string[]): boolean =>
  cities.some((c) => normCity.includes(c))

const findHoliday = ({ month, day }: RiskContext) =>
  HOLIDAYS.find((h) => h.month === month && h.day === day)

// --- Predicates -------------------------------------------------------------

/** Nov 1 – Feb 28/29, weddings only. */
const isWinterSaya = ({ month, eventType }: RiskContext): boolean =>
  (month === 10 || month === 11 || month === 0 || month === 1) && eventType === 'wedding'

/** Apr 15 – May 31, weddings only. */
const isSummerSaya = ({ month, day, eventType }: RiskContext): boolean =>
  ((month === 3 && day >= 15) || month === 4) && eventType === 'wedding'

/** Jun 15 – Aug 31 pan-India, extended to Sep 15 on the West Coast. */
const isMonsoon = ({ month, day, normCity }: RiskContext): boolean => {
  const panIndia = (month === 5 && day >= 15) || month === 6 || month === 7
  const westCoastExtended =
    cityMatches(normCity, WEST_COAST_MONSOON_CITIES) && month === 8 && day <= 15
  return panIndia || westCoastExtended
}

/** May 1 – Jun 30 in North & Central India. */
const isExtremeHeat = ({ month, normCity }: RiskContext): boolean =>
  (month === 4 || month === 5) && cityMatches(normCity, NORTH_CENTRAL_HEAT_CITIES)

const isHoliday = (ctx: RiskContext): boolean => findHoliday(ctx) !== undefined

// --- Rule table (order = result order) --------------------------------------

export const ENVIRONMENTAL_RULES: EnvironmentalRule[] = [
  {
    id: 'peak_saya_winter',
    applies: isWinterSaya,
    build: () => ({
      id: 'peak_saya_winter',
      title: 'Peak Winter Saya Season',
      severity: 'advisory',
      description:
        'Auspicious winter wedding dates across India experience intense booking competition for premier venues and cinematographers.',
      affectedCategories: ['venue', 'photo_film'],
      leadTimeBufferDays: 30,
      recommendation:
        'High celebration density. Book venues and photography teams 7-8 months in advance.',
    }),
  },
  {
    id: 'peak_saya_summer',
    applies: isSummerSaya,
    build: () => ({
      id: 'peak_saya_summer',
      title: 'Peak Summer Saya Season',
      severity: 'advisory',
      description:
        'Auspicious summer wedding dates create high demand for climate-controlled banquet halls and indoor mandaps.',
      affectedCategories: ['venue'],
      leadTimeBufferDays: 15,
      recommendation:
        'High demand for air-conditioned banquet spaces. Book venues 6+ months in advance.',
    }),
  },
  {
    id: 'monsoon_outdoor',
    applies: isMonsoon,
    build: () => ({
      id: 'monsoon_outdoor',
      title: 'Monsoon Weather Hazard',
      severity: 'warning',
      description:
        'High rainfall hazard detected for outdoor lawns and open-air mandaps during the monsoon season.',
      affectedCategories: ['venue', 'decor'],
      recommendation:
        'High rainfall hazard. Secure covered backups, waterproof shamiana staging, and raised electrical platforms.',
    }),
  },
  {
    id: 'extreme_summer_heat',
    applies: isExtremeHeat,
    build: () => ({
      id: 'extreme_summer_heat',
      title: 'Extreme Summer Heat Advisory',
      severity: 'advisory',
      description:
        'Daytime temperatures frequently exceed 40°C in North and Central India during May and June.',
      affectedCategories: ['catering', 'venue', 'decor'],
      recommendation:
        'High temperatures (>40°C). Schedule ceremonies post-sunset, provide misting systems and chilled hydration counters.',
    }),
  },
  {
    id: 'holiday_clash',
    applies: isHoliday,
    build: (ctx) => {
      const holidayName = findHoliday(ctx)?.name ?? ''
      return {
        id: 'holiday_clash',
        title: `National Holiday / Civic Advisory (${holidayName})`,
        severity: 'warning',
        description: `${holidayName} involves strict civic regulations, dry day alcohol rules, and rigid 10:00 PM sound curfews.`,
        affectedCategories: ['entertainment', 'venue'],
        recommendation:
          'Dry day regulations and strict 10 PM outdoor sound curfews apply. Plan indoor transitions and advance permits.',
      }
    },
  },
]
