import { describe, it, expect } from 'vitest'
import { detectEnvironmentalRisks } from '@/lib/engine/environmental'
import { calculateBackwardsTimeline, type AdoptedIdeaTimelineInput } from '@/lib/engine/timeline'

describe('Pure UTC Environmental Date Risk Engine (TIME-02, TIME-03, ADR-0005)', () => {
  it('detects Peak Winter Saya in Delhi with +30d buffer on venue and photo tasks', () => {
    const analysis = detectEnvironmentalRisks('2025-12-10', 'Delhi NCR', 'wedding')

    expect(analysis.isPeakSayaSeason).toBe(true)
    const winterRisk = analysis.detectedRisks.find((r) => r.id === 'peak_saya_winter')
    expect(winterRisk).toBeDefined()
    expect(winterRisk?.leadTimeBufferDays).toBe(30)
    expect(winterRisk?.affectedCategories).toContain('venue')
    expect(winterRisk?.affectedCategories).toContain('photo_film')
    expect(analysis.seasonalSummaryTitle).toContain('Peak Saya')

    // Timeline calculation incorporates +30d buffer
    const schedule = calculateBackwardsTimeline('2025-12-10', 150, '2025-03-01', analysis)

    const t6mBand = schedule.milestoneBands.find((b) => b.id === 'milestone_t6m')!
    expect(t6mBand).toBeDefined()

    // Without buffer: 2025-12-10 minus 180 days = 2025-06-13
    // With 30d buffer: 2025-12-10 minus 210 days = 2025-05-14
    expect(t6mBand.targetDate).toBe('2025-05-14')

    const venueTask = t6mBand.tasks.find((t) => t.id === 'task_venue_contract')!
    expect(venueTask.appliedBufferDays).toBe(30)
    expect(venueTask.environmentalRiskId).toBe('peak_saya_winter')
    expect(venueTask.environmentalAdvisory).toBeDefined()

    const photoTask = t6mBand.tasks.find((t) => t.id === 'task_photo_book')!
    expect(photoTask.appliedBufferDays).toBe(30)
    expect(photoTask.environmentalRiskId).toBe('peak_saya_winter')
  })

  it('detects Summer Saya (+15d) and extreme summer heat in Jaipur', () => {
    const analysis = detectEnvironmentalRisks('2025-05-18', 'Jaipur', 'wedding')

    expect(analysis.isPeakSayaSeason).toBe(true)
    expect(analysis.hasWeatherHazards).toBe(true)

    const summerSaya = analysis.detectedRisks.find((r) => r.id === 'peak_saya_summer')
    expect(summerSaya).toBeDefined()
    expect(summerSaya?.leadTimeBufferDays).toBe(15)

    const heatRisk = analysis.detectedRisks.find((r) => r.id === 'extreme_summer_heat')
    expect(heatRisk).toBeDefined()
    expect(heatRisk?.affectedCategories).toContain('catering')

    // Timeline calculation incorporates +15d venue buffer and heat advisory
    const schedule = calculateBackwardsTimeline('2025-05-18', 150, '2024-10-01', analysis)

    const t6mBand = schedule.milestoneBands.find((b) => b.id === 'milestone_t6m')!
    // 2025-05-18 minus (180 + 15 = 195 days)
    // May 18 - 195 days = 2024-11-04
    expect(t6mBand.targetDate).toBe('2024-11-04')

    const venueTask = t6mBand.tasks.find((t) => t.id === 'task_venue_contract')!
    expect(venueTask.appliedBufferDays).toBe(15)
    expect(venueTask.environmentalRiskId).toBe('peak_saya_summer')

    const t3mBand = schedule.milestoneBands.find((b) => b.id === 'milestone_t3m')!
    const cateringTask = t3mBand.tasks.find((t) => t.id === 'task_catering_tasting')!
    expect(cateringTask.environmentalRiskId).toBe('extreme_summer_heat')
  })

  it('detects monsoon outdoor hazards pan-India and on the West Coast', () => {
    // Pan-India monsoon: July 20 in Delhi
    const delhiMonsoon = detectEnvironmentalRisks('2025-07-20', 'Delhi', 'wedding')
    expect(delhiMonsoon.hasWeatherHazards).toBe(true)
    const monsoonRisk = delhiMonsoon.detectedRisks.find((r) => r.id === 'monsoon_outdoor')
    expect(monsoonRisk).toBeDefined()
    expect(monsoonRisk?.severity).toBe('warning')
    expect(monsoonRisk?.affectedCategories).toContain('venue')
    expect(monsoonRisk?.affectedCategories).toContain('decor')

    // West Coast extended monsoon: Sep 5 in Mumbai
    const mumbaiSepMonsoon = detectEnvironmentalRisks('2025-09-05', 'Mumbai', 'wedding')
    expect(mumbaiSepMonsoon.hasWeatherHazards).toBe(true)
    expect(mumbaiSepMonsoon.detectedRisks.some((r) => r.id === 'monsoon_outdoor')).toBe(true)

    // Non-West Coast: Sep 5 in Delhi has no monsoon risk
    const delhiSepNoMonsoon = detectEnvironmentalRisks('2025-09-05', 'Delhi', 'wedding')
    expect(delhiSepNoMonsoon.detectedRisks.some((r) => r.id === 'monsoon_outdoor')).toBe(false)

    // Timeline decor task carries monsoon advisory
    const schedule = calculateBackwardsTimeline('2025-07-20', 150, '2025-01-01', delhiMonsoon)
    const t3mBand = schedule.milestoneBands.find((b) => b.id === 'milestone_t3m')!
    const decorTask = t3mBand.tasks.find((t) => t.id === 'task_decor_concept')!
    expect(decorTask.environmentalRiskId).toBe('monsoon_outdoor')
    expect(decorTask.environmentalAdvisory).toContain('waterproof')
  })

  it('detects national holidays (Independence Day & Republic Day) and alerts sound curfews', () => {
    const aug15 = detectEnvironmentalRisks('2025-08-15', 'Bengaluru', 'birthday')
    expect(aug15.hasHolidayClash).toBe(true)
    const holidayRisk = aug15.detectedRisks.find((r) => r.id === 'holiday_clash')
    expect(holidayRisk).toBeDefined()
    expect(holidayRisk?.severity).toBe('warning')
    expect(holidayRisk?.affectedCategories).toContain('entertainment')

    const jan26 = detectEnvironmentalRisks('2025-01-26', 'Kolkata', 'community')
    expect(jan26.hasHolidayClash).toBe(true)

    const schedule = calculateBackwardsTimeline('2025-08-15', 100, '2025-01-01', aug15)
    const t3mBand = schedule.milestoneBands.find((b) => b.id === 'milestone_t3m')!
    const entertainmentTask = t3mBand.tasks.find((t) => t.id === 'task_entertainment_permit')!
    expect(entertainmentTask.environmentalRiskId).toBe('holiday_clash')
  })

  it('dynamic lead-time expansion shifts venue milestone target date exactly 30 days earlier', () => {
    const normalAnalysis = detectEnvironmentalRisks('2025-11-15', 'Bengaluru', 'birthday')
    const sayaAnalysis = detectEnvironmentalRisks('2025-11-15', 'Bengaluru', 'wedding')

    const normalSchedule = calculateBackwardsTimeline(
      '2025-11-15',
      150,
      '2025-01-01',
      normalAnalysis
    )
    const sayaSchedule = calculateBackwardsTimeline('2025-11-15', 150, '2025-01-01', sayaAnalysis)

    const normalT6m = normalSchedule.milestoneBands.find((b) => b.id === 'milestone_t6m')!
    const sayaT6m = sayaSchedule.milestoneBands.find((b) => b.id === 'milestone_t6m')!

    const normalDate = new Date(normalT6m.targetDate).getTime()
    const sayaDate = new Date(sayaT6m.targetDate).getTime()
    const diffDays = Math.round((normalDate - sayaDate) / (1000 * 60 * 60 * 24))

    expect(diffDays).toBe(30)
  })

  it('short-notice event (<60 days) triggers Compressed Mode and organizes critical path blockers (ADR-0005)', () => {
    // Planning an event 35 days out
    const today = '2025-05-01'
    const eventDate = '2025-06-05'

    const schedule = calculateBackwardsTimeline(eventDate, 150, today)

    expect(schedule.isCompressedMode).toBe(true)
    const immediateBand = schedule.milestoneBands[0]
    expect(immediateBand.id).toBe('milestone_immediate')
    expect(immediateBand.isImmediateAction).toBe(true)
    expect(immediateBand.targetDate).toBe(today)

    // Critical path triage: Venue (rank 1), Catering (rank 2), Photo (rank 3) at top
    const tasks = immediateBand.tasks
    expect(tasks[0].budgetCategory).toBe('venue')
    expect(tasks[1].budgetCategory).toBe('catering')
    expect(tasks[2].budgetCategory).toBe('photo_film')
  })

  it('adopted idea task injection properly inserts idea milestone into timeline', () => {
    const adoptedIdeas: AdoptedIdeaTimelineInput[] = [
      {
        ideaId: 'chai_bar',
        title: 'Kulhad Chai & Filter Coffee Bar',
        targetCategory: 'catering',
        costPaise: 1500000,
        displacedDonors: [],
        adoptedAt: '2025-03-01',
        leadDays: 21,
        timelineTask: {
          title: 'Book Kulhad Chai Artisan & Tasting',
          notes: 'Confirm live clay pot brewing and spices',
        },
      },
    ]

    const schedule = calculateBackwardsTimeline(
      '2025-10-15',
      150,
      '2025-03-01',
      undefined,
      adoptedIdeas
    )

    // 21 days lead maps to milestone_t1m
    const t1mBand = schedule.milestoneBands.find((b) => b.id === 'milestone_t1m')!
    expect(t1mBand).toBeDefined()

    const injectedTask = t1mBand.tasks.find((t) => t.originIdeaId === 'chai_bar')
    expect(injectedTask).toBeDefined()
    expect(injectedTask?.title).toBe('Book Kulhad Chai Artisan & Tasting')
    expect(injectedTask?.budgetCategory).toBe('catering')
    expect(injectedTask?.leadDays).toBe(21)
    expect(injectedTask?.notes).toContain('Confirm live clay pot')
  })

  it('non-wedding events (birthday, community) do not trigger peak Saya seasons', () => {
    const birthdayAnalysis = detectEnvironmentalRisks('2025-12-10', 'Delhi', 'birthday')
    expect(birthdayAnalysis.isPeakSayaSeason).toBe(false)
    expect(birthdayAnalysis.detectedRisks.some((r) => r.id === 'peak_saya_winter')).toBe(false)

    const communityAnalysis = detectEnvironmentalRisks('2025-05-18', 'Jaipur', 'community')
    expect(communityAnalysis.isPeakSayaSeason).toBe(false)
    expect(communityAnalysis.detectedRisks.some((r) => r.id === 'peak_saya_summer')).toBe(false)
    // But community in Jaipur during May still carries extreme summer heat!
    expect(communityAnalysis.hasWeatherHazards).toBe(true)
    expect(communityAnalysis.detectedRisks.some((r) => r.id === 'extreme_summer_heat')).toBe(true)
  })
})
