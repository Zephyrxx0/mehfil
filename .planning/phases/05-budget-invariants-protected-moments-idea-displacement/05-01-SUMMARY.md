---
phase: "05"
plan: "01"
status: "completed"
date: "2026-10-28"
requirements:
  - BUDGET-03
  - BUDGET-04
  - MOMENT-02
  - IDEA-02
  - IDEA-03
tags:
  - budget-engine
  - zero-sum-displacement
  - elasticity-ranks
  - protected-moment
  - shortfall-remedies
  - plan-diff
---

# Phase 05 Plan 01 Summary: Pure TS Budget Invariants, Protected Moment Immunity, Zero-Sum Displacement & Shortfall Remedies

## Overview

Plan 05-01 establishes the pure TypeScript mathematical contracts and invariant preservation engine for Phase 5. It implements zero-sum celebration idea displacement (`adoptIdea`), exact inverse reversion (`retractIdea`), standardized archetype elasticity ranks (Misc=1, Entertainment=2, Decor=3), targeted sequential elasticity trimming (`applyTrimElasticRemedy`), deterministic 3-way shortfall remedy calculations, and plain-language diff sentence generation.

## Key Deliverables

1. **Domain Type Contracts (`src/lib/engine/types.ts`)**:
   - Added interfaces `DisplacedDonor`, `IdeaDisplacementRecord`, `CuratedIdea`.
   - Added types `EnvironmentalRiskId`, `EnvironmentalRiskAdvisory`, and `EnvironmentalAnalysis` for date risk analysis.
   - Extended `Plan` with `adoptedIdeas?: IdeaDisplacementRecord[]` and `environmentalAnalysis?: EnvironmentalAnalysis`.
   - Extended `TimelineTask` with `appliedBufferDays`, `environmentalRiskId`, `environmentalAdvisory`, and `originIdeaId`.

2. **Standardized Elasticity Ranks (`src/lib/engine/archetypes.ts`)**:
   - Uniformly mapped flexible lines across all 3 archetypes (`indian-wedding`, `milestone-birthday`, `community-cultural`):
     - `misc`: `elasticityRank = 1` (trimmed first)
     - `entertainment`: `elasticityRank = 2` (trimmed second)
     - `decor`: `elasticityRank = 3` (trimmed third)

3. **Zero-Sum Displacement Engine (`src/lib/engine/budget.ts`)**:
   - `adoptIdea(plan, idea)`: Drains flexible donor lines in strict ascending elasticity order down to each line's 40% baseline floor. Credits target category with full idea cost.
   - Protected Moment immunity: Explicitly enforces `!line.isProtected` so protected moments never donate funds, even if they belong to flexible categories (MOMENT-02).
   - Permissive shortfall: If donor capacity is exhausted, clamps lines to 40% floor, sets `isInfeasible = true`, records `shortfallPaise`, and attaches deterministic remedies (ADR-0002, D-04).
   - `retractIdea(plan, ideaId)`: Restores exact integer paise back to original donor lines in reverse order, cleanses shortfall, and restores feasible status (IDEA-03, D-07).

4. **Targeted Sequential Elasticity Trim Remedy (`src/lib/engine/budget.ts`)**:
   - `applyTrimElasticRemedy(plan, deficitPaise)`: Trims flexible lines sequentially in elasticity order only until the exact deficit is absorbed (D-15), preventing blunt over-clamping.
   - Enforces 40% floor and Protected Moment immunity throughout.
   - Refined `calculateShortfallRemedies` to list candidate categories in elasticity rank order.

5. **Plain-Language Audit Diff Engine (`src/lib/engine/diff.ts`)**:
   - Generates plain-language sentences for idea adoption highlighting donors and Protected Moment immunity.
   - Generates exact inverse diff sentences for idea retraction.
   - Generates plain-language sentences for applying shortfall remedies (budget increase, guest reduction, targeted flexible trim).
   - Formats all monetary figures via `formatINR`.

6. **Comprehensive Automated Test Suites**:
   - `tests/engine/displacement.test.ts`: 7 tests covering elasticity rank draining, floor preservation, Protected Moment immunity, exact inverse reversion, and a 1,000-cycle randomized adopt/retract property test preserving the exact paise sum invariant.
   - `tests/engine/remedies.test.ts`: 5 tests verifying 3 deterministic remedies, targeted trim behavior, floor preservation, Protected Moment immunity, and Remedy 1 feasibility restoration.
   - `tests/engine/diff.test.ts`: 11 tests verifying plain-language diff generation for idea adoption, retraction, and shortfall remedies.

## Verification

- `pnpm vitest run tests/engine/displacement.test.ts`: 7 passed
- `pnpm vitest run tests/engine/remedies.test.ts`: 5 passed
- `pnpm vitest run tests/engine/diff.test.ts`: 11 passed
- `pnpm vitest run tests/engine/`: 12 test files passed (87 tests)
- `pnpm vitest run`: 30 test files passed (205 tests)
