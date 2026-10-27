---
phase: "01"
plan: "02"
subsystem: "engine"
tags: ["timeline", "scheduler", "calendar", "ics", "rfc-5545", "triage"]
status: complete
requires:
  - "01-01"
provides:
  - "Backwards milestone scheduler using pure UTC calendar offsets"
  - "Guest scale lead time multipliers (>250 guests +30d, <=80 guests -30d to -60d)"
  - "ADR-0005 Immediate Action sprint triage with topological criticality ordering"
  - "RFC 5545 iCalendar (.ics) export with 9:00 AM VALARM reminders and budget links"
affects:
  - "src/lib/engine/types.ts"
  - "src/lib/engine/timeline.ts"
  - "src/lib/engine/ics.ts"
key-files:
  created:
    - "src/lib/engine/timeline.ts"
    - "src/lib/engine/ics.ts"
    - "tests/engine/timeline.test.ts"
    - "tests/engine/ics.test.ts"
  modified:
    - "src/lib/engine/types.ts"
decisions:
  - "D-13, D-14, D-15, D-16"
metrics:
  tasks: 2
  commits: 2
  tests: 9
actuals:
  tokens: 14200
  tasks: 2
  commits: 2
---

# Phase 01 Plan 02: Backwards Topological Timeline Scheduler & ICS Export Summary

**One-liner:** Backwards UTC milestone scheduler scaling lead times with guest counts, triaging short-notice past tasks into an Immediate Action band ordered by critical path, and exporting compliant RFC 5545 `.ics` calendar files with 9:00 AM morning alarms.

## What Was Built

1. **Backwards Milestone Scheduler & Immediate Action Triage (Task 1):**
   - Added timeline contracts to `src/lib/engine/types.ts`: `MilestoneBandId`, `TimelineTask`, `MilestoneBand`, and `TimelineSchedule`.
   - Built `src/lib/engine/timeline.ts` implementing `calculateBackwardsTimeline()`:
     - Calculates UTC calendar day offsets backwards from event date: T-6M (Venue/Date Lock, 180d), T-3M (Catering/Vendors, 90d), T-1M (Invites/Fittings, 30d), T-2W (Final Numbers, 14d), Day-Of (0d).
     - Applied guest scale multipliers: `guestCount > 250` scales T-6M to 210d and T-3M to 120d; `guestCount <= 80` compresses to 120d and 60d.
     - Implemented ADR-0005 Immediate Action triage: when milestones fall in the past relative to today, bundles them into an `Immediate Action (This Week)` band sequenced by topological criticality (Venue -> Catering -> Photo -> Invites -> Others) without anxiety-inducing overdue warnings.
     - Bound every timeline task to its corresponding `budgetCategory` for 1-click cross-linking (D-16).

2. **RFC 5545 iCalendar (.ics) Generator & Exporter (Task 2):**
   - Built `src/lib/engine/ics.ts` implementing `generateICS()` and `downloadICS()`:
     - Generates valid RFC 5545 `VCALENDAR` format with `VERSION:2.0` and `PRODID:-//Mehfil//Celebration Planner//EN`.
     - Creates all-day `VEVENT` blocks using `VALUE=DATE:YYYYMMDD` with next-day end bounds.
     - Embeds 9:00 AM `VALARM` display reminder alerts (`TRIGGER:PT9H` relative to midnight start, fulfilling D-15).
     - Generates rich milestone checklists in `DESCRIPTION` linking category names and formatted rupee allocations.
     - Implemented browser-safe `downloadICS()` leveraging in-memory Blob and URL object cleanup.

## Verification Results

All 9 automated unit tests passed:
- `tests/engine/timeline.test.ts`: 5/5 passed (backwards offsets, large gathering scaling, intimate gathering compression, ADR-0005 Compressed Mode triage, category identifier mapping).
- `tests/engine/ics.test.ts`: 4/4 passed (RFC 5545 syntax compliance, all-day VEVENT bounds, 9:00 AM VALARM reminders, category budget descriptions).
- Full engine regression test suite: 35/35 tests passed across 5 test files.

## Deviations from Plan
None — plan executed exactly as written.

## Git Commits
- `db54294`: `feat(01-02): implement backwards milestone scheduler with guest scale multipliers and immediate action triage`
- `a6ab02c`: `feat(01-02): implement RFC 5545 iCalendar generator with 9:00 AM alarms and budget links`
