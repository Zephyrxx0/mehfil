---
phase: "01"
plan: "01"
subsystem: "engine"
tags: ["budget", "currency", "archetypes", "arithmetic", "hare-niemeyer"]
status: complete
requires: []
provides:
  - "Pure TypeScript budget engine with integer paise precision"
  - "Hare-Niemeyer largest-remainder apportionment at rupee boundary"
  - "Authentic Indian currency formatter and parser (Lakh/Crore shorthand)"
  - "Three hardcoded instant celebration archetypes (<10ms instantiation)"
  - "Dynamic guest count scaling with 40% floor and ADR-0002 Permissive Shortfall solver"
  - "Protected Moment immunity from downward trimming (ADR-0004)"
affects:
  - "src/lib/engine/types.ts"
  - "src/lib/engine/currency.ts"
  - "src/lib/engine/archetypes.ts"
  - "src/lib/engine/budget.ts"
key-files:
  created:
    - "package.json"
    - "tsconfig.json"
    - "vitest.config.ts"
    - "tests/setup.ts"
    - "src/lib/utils.ts"
    - "src/lib/engine/types.ts"
    - "src/lib/engine/currency.ts"
    - "src/lib/engine/archetypes.ts"
    - "src/lib/engine/budget.ts"
    - "tests/engine/currency.test.ts"
    - "tests/engine/archetypes.test.ts"
    - "tests/engine/budget.test.ts"
decisions:
  - "D-05, D-06, D-07, D-08, D-09, D-10, D-11"
metrics:
  tasks: 3
  commits: 3
  tests: 26
actuals:
  tokens: 18500
  tasks: 3
  commits: 3
---

# Phase 01 Plan 01: Pure TypeScript Budget Engine & Project Initialization Summary

**One-liner:** Zero-float budget engine operating in integer paise with Hare-Niemeyer display apportionment, 3 instant celebration archetypes, dynamic guest rebalancing with 40% floor clamps, and ADR-0002 shortfall remedies.

## What Was Built

1. **Project Scaffold & Test Setup (Task 1):**
   - Configured Next.js 15, TypeScript 5.6+, Tailwind CSS 3.4, and Vitest 3.x with happy-dom environment.
   - Set up `@/` path alias and `cn()` utility in `src/lib/utils.ts`.
   - Verified that `pnpm vitest run` executes cleanly in-memory.

2. **Domain Contracts, Currency, & Archetypes (Task 2):**
   - Defined core domain types in `src/lib/engine/types.ts`: `Paise`, `Rupees`, `EventType`, `LineType`, `BudgetCategory`, `BudgetLine`, `EventBrief`, `Plan`, and `ShortfallRemedy`.
   - Built `src/lib/engine/currency.ts` implementing `formatINR()` with authentic Indian comma groupings (`₹25,00,000`) and compact Lakh/Crore notation (`₹25L`, `₹2.5Cr`), alongside robust string parser `parseINRInput()`.
   - Built `src/lib/engine/archetypes.ts` defining 3 baseline archetypes: Indian Wedding (`₹25L`, 300 guests), Milestone Birthday (`₹5L`, 80 guests), and Community Cultural Meet (`₹8L`, 200 guests). Implemented `instantiatePlanFromBrief()` executing in <10ms with zero model arithmetic.

3. **Budget Engine & Shortfall Solver (Task 3):**
   - Built `src/lib/engine/budget.ts` implementing:
     - `apportionRupees`: Hare-Niemeyer largest-remainder algorithm preserving the exact rupee and paise sum invariant.
     - `rebalanceGuestCount`: Scaled per-guest allocations proportionally, preserved fixed/buffer lines, protected the designated Protected Moment with complete immunity (ADR-0004), and clamped elastic donor lines strictly at their 40% baseline floor (D-11).
     - `calculateShortfallRemedies`: Deterministic solver generating 3 mathematical remedies (budget increase, max feasible guests, elastic line trim) when demand exceeds donor capacity (ADR-0002).
     - `setProtectedMoment`: 1-click star/lock category reassignment.

## Verification Results

All 26 automated unit and property-based tests passed:
- `tests/engine/currency.test.ts`: 8/8 passed (Indian commas, compact Lakh/Crore, rounding, parse variations).
- `tests/engine/archetypes.test.ts`: 8/8 passed (archetype line ratio sums = 1.0, sum invariant across all 3 archetypes, Protected Moment assignment, <10ms performance benchmark).
- `tests/engine/budget.test.ts`: 10/10 passed (property test over 1,000 random budgets with 100% exact sum match, guest scaling, 40% floor constraint, Protected Moment immunity, ADR-0002 shortfall remedies).

## Deviations from Plan

### Auto-fixed Issues
**1. [Rule 1 - Bug] Elastic lines clamp below 40% floor when available budget drops below floor sum**
- **Found during:** Task 3 verification of 10x guest scaling test.
- **Issue:** When available elastic budget was less than the sum of 40% floors, proportional apportionment before flooring resulted in negative post-sum adjustments.
- **Fix:** Structured the solver to check if `elasticBudget < sumFloors`: if so, immediately clamp all elastic lines to their exact 40% floor, flag `isInfeasible: true`, and assign `shortfallPaise = sumFloors - elasticBudget`. If `elasticBudget >= sumFloors`, assign each line its floor and apportion the surplus.
- **Files modified:** `src/lib/engine/budget.ts`
- **Commit:** `0f32d47`

## Git Commits
- `63c6e03`: `chore(01-01): init Next.js 15 project scaffold with Vitest 3`
- `d2715a8`: `feat(01-01): implement domain types, INR formatter/parser, and celebration archetypes`
- `0f32d47`: `feat(01-01): implement Hare-Niemeyer budget engine with guest scaling and ADR-0002 shortfall solver`

