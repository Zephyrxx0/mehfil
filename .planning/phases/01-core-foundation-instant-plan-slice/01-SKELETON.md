# Walking Skeleton — Mehfil (महफ़िल)

**Phase:** 1
**Generated:** 2026-10-27

## Capability Proven End-to-End

A user can choose or input celebration parameters (archetype, date, guests, budget) via a 3-step modal, generate a mathematically balanced baseline plan in <10ms, view whole-rupee budget allocations with a highlighted Protected Moment, inspect backwards-scheduled milestone bands with triage for close dates, dynamically adjust guest scale while preserving invariants, and export the timeline as an RFC 5545 `.ics` calendar file.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router (`src/app`) | Modern full-stack React framework with SSR, streaming, and fast client routing for generative UI components |
| Pure Functional Engine | Pure TypeScript in `src/lib/engine/` | Zero-dependency calculation engine completely decoupled from React and database layers, guaranteeing <10ms execution and 100% deterministic unit testing |
| Currency Precision | Integer Paise (`paise: number`) | Prevents IEEE-754 floating-point drift; safely represents budgets up to ₹90,000 Crores within `Number.MAX_SAFE_INTEGER` |
| Rounding Solver | Hare-Niemeyer (Largest Remainder) | Apportions whole rupees and paise across lines deterministically so allocations sum exactly to total budget with zero ±₹1 discrepancies (D-10) |
| Styling & Tokens | Tailwind CSS 3.4 with custom semantic tokens | Warm Ivory base (`#FDFBF7`), Royal Plum (`#2E1020`), Gulabi Rose (`#D94676`), and Marigold (`#D97706`), enforcing 3-hue WCAG AAA palette discipline |
| UI Component Library | Radix UI primitives & Lucide React | Accessible, lightweight modal, dialog, and slider primitives |
| Calendar Export | Pure RFC 5545 `.ics` generator | Generates standard iCalendar files with all-day events and 9:00 AM alarms without external library bloat |
| Test Runner | Vitest 3.x | Sub-second execution for property-based arithmetic invariant and timeline dependency tests |

## Stack Touched in Phase 1

- [x] **Project scaffold:** Next.js 15 App Router, TypeScript 5.6+, Tailwind CSS 3.4, Vitest 3.x
- [x] **Routing:** Root route `/` with hero trigger and interactive plan workspace
- [x] **State & Engine Layer:** Pure TypeScript budget engine (integer paise, largest-remainder solver, per-guest scaling, 40% floor) and timeline engine (backwards schedule, compressed triage)
- [x] **UI:** 3-step brief intake micro-wizard with starter chips, budget category cards with Protected Moment Gulabi Rose badge and star toggle, milestone bands with category anchor pills, and shortfall banner
- [x] **Deployment / Local Execution:** Fully verified local command `pnpm dev` on port 3000 and test suite `pnpm test`

## Out of Scope (Deferred to Later Slices)

The following capabilities are deliberately excluded from Phase 1 to preserve a razor-thin, production-quality walking skeleton:
- Supabase PostgreSQL persistence and Row-Level Security (scoped for Phase 3)
- Organizer Edit Key URL generation and read-only Family Share links (scoped for Phase 3)
- Curated 24 Style Swatch visual gallery and multi-agent vision analysis (scoped for Phase 4)
- Multi-tier LLM fallback ladder (Gemma -> Gemini Flash) and bounded baseline modulation (scoped for Phase 4)
- Idea displacement suggestions and undo stacks (scoped for Phase 5)
- Quarantined vendor quote intake and OCR screenshot extraction (scoped for Phase 6)
- Closed registry generative UI dynamic component rendering (scoped for Phase 6)

## Subsequent Slice Plan

Each later phase adds one vertical capability on top of this skeleton without altering its core architectural decisions:

- **Phase 2: Festive Design System & Centerpiece Kinetic Hero** — Rich cultural motion curves, authentic typography pairing (Fraunces & Tiro Devanagari Hindi), audio micro-chimes, and tactile Indian aesthetic polish.
- **Phase 3: Anonymous Persistence & Dual-Link Collaboration** — Supabase anonymous auth, RLS-backed immutable plan versioning, Organizer Edit Key URL, and sanitized read-only Family Share view.
- **Phase 4: Multi-Agent Style DNA & Resilient Fallback Ladder** — Curated 24-swatch visual vibe intake, vision-based Style DNA extraction, bounded multiplier modulation, and Gemini/Gemma fallback ladder.
- **Phase 5: Budget Invariants, Protected Moments & Idea Displacement** — Deep displacement engine, interactive idea catalog, budget-neutral swap simulation, and micro-haptic locks.
- **Phase 6: Quarantined Quote Check & Closed Registry Generative UI** — Isolated prompt quarantine for vendor quotes, Verbatim Evidence numeric guard, and allowlisted Generative UI component registry.
