import { describe, it, expect } from 'vitest'
import { generateICS } from '@/lib/engine/ics'
import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
import { instantiatePlanFromBrief } from '@/lib/engine/archetypes'
import type { EventBrief } from '@/lib/engine/types'

describe('generateICS', () => {
  const brief: EventBrief = {
    title: 'Aditi & Kabir Wedding',
    eventType: 'wedding',
    eventDate: '2026-11-20',
    city: 'Jaipur',
    guestCount: 300,
    totalBudgetPaise: 250_000_000,
    protectedCategory: 'catering',
  }

  const plan = instantiatePlanFromBrief(brief)
  const schedule = calculateBackwardsTimeline(brief.eventDate, brief.guestCount, '2026-03-01')

  it('generates compliant RFC 5545 format with VCALENDAR blocks (TIME-04)', () => {
    const ics = generateICS(schedule, plan)

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.includes('VERSION:2.0\r\n')).toBe(true)
    expect(ics.includes('PRODID:-//Mehfil//Celebration Planner//EN\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('generates all-day VEVENT entries with valid DTSTART and DTEND for all bands', () => {
    const ics = generateICS(schedule, plan)
    const eventMatches = ics.match(/BEGIN:VEVENT/g)
    expect(eventMatches?.length).toBe(schedule.milestoneBands.length)

    // Check all-day date format VALUE=DATE:YYYYMMDD
    expect(ics).toMatch(/DTSTART;VALUE=DATE:\d{8}/)
    expect(ics).toMatch(/DTEND;VALUE=DATE:\d{8}/)
  })

  it('includes 9:00 AM VALARM reminder alarms for every milestone (D-15)', () => {
    const ics = generateICS(schedule, plan)
    const alarmMatches = ics.match(/BEGIN:VALARM/g)
    expect(alarmMatches?.length).toBe(schedule.milestoneBands.length)

    expect(ics).toContain('ACTION:DISPLAY')
    expect(ics).toContain('TRIGGER:PT9H')
  })

  it('event descriptions contain linked budget category names and formatted rupee amounts', () => {
    const ics = generateICS(schedule, plan)

    expect(ics).toContain('Venue & Stage')
    expect(ics).toContain('Catering & Meals')
    expect(ics).toContain('Aditi & Kabir Wedding')
    // Rupees should be formatted with Indian currency symbol
    expect(ics).toMatch(/₹\d+/)
  })
})

