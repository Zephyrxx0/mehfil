---
phase: "05"
plan: "03"
status: "completed"
date: "2026-10-28"
requirements:
  - MOMENT-03
  - IDEA-01
  - IDEA-02
  - IDEA-03
  - BUDGET-03
  - BUDGET-04
  - TIME-02
  - TIME-03
tags:
  - curated-ideas-tab
  - protected-moment-shimmer
  - micro-haptics
  - inline-donor-tags
  - permissive-remedies
  - seasonal-advisory-banner
  - tier-1-instant-undo
  - compressed-mode-triage
---

# Phase 05 Plan 03 Summary: Reactive Workspace UI — Curated Ideas Tab, Protected Moment Tactile Highlights, Permissive Remedies & Instant Undo

## Overview

Plan 05-03 brings Phase 5's mathematical guarantees, zero-sum idea displacement, and date intelligence into a tactile, responsive UI. Organizers can browse curated Indian celebration ideas in a dedicated workspace tab, toggle enhancements with micro-haptic feedback, observe Protected Moments holding inviolable with Gulabi Rose shimmer, track donor deductions via amber pills on affected budget cards, apply deterministic shortfall remedies with 1-click certainty, and reverse any modification instantly with an 8-second floating undo bar.

## Key Deliverables

1. **Protected Moment Visual & Tactile Reinforcements (`BudgetLineCard.tsx`)**:
   - Gulabi Rose visual tokens (`border-gulabi-rose bg-gulabi-rose/15 shadow-sm ring-1 ring-gulabi-rose/50`).
   - Pure CSS `@keyframes roseShimmer` simulating festive light reflections across the gold/rose lock icon and hairline border, with reduced motion accessibility compliance.
   - Micro-haptic pulse (`navigator.vibrate(50)`) with feature detection on lock button toggle.
   - Explicit inviolable immunity badge and tooltip: *"Protected Moment is mathematically immune to displacement (ADR-0004)"*.
   - Inline donor tags mapping over `displacedRecords` displaying amber deduction pills (e.g. `-₹15,000 for Kulhad Chai Bar`) and 40% floor indicator.

2. **Curated Celebration Ideas Workspace (`CuratedIdeaCard.tsx`, `CuratedIdeasSection.tsx`, `WorkspaceShell.tsx`)**:
   - `CuratedIdeaCard`:
     - Displays title, authentic Devanagari flourishes (`idea.devanagariTitle`), and tagline.
     - Accessible toggle switch (`role="switch"`) with micro-haptic pulse on toggle.
     - Category badge, formatted cost in INR (`formatINR(idea.costPaise)`), lead time badge (`Clock` icon with `{idea.leadDays}d lead`), and festive Marigold "Adopted" badge with `Sparkles`.
     - Pre-adoption capacity calculation: warns organizers when adopting an enhancement will exhaust flexible donor capacity and activate Shortfall Banner remedies.
     - Cultural nuance callout box highlighting authentic heritage context.
   - `CuratedIdeasSection`:
     - Top summary metrics strip: Adopted count, Total invested in enhancements, and Remaining flexible capacity.
     - Category filter pills: "All", "Catering", "Entertainment", "Decor", "Favors", "Photography".
     - Real-time search/filter input matching English, Devanagari, tags, and nuance text.
     - Grid layout rendering deterministically scored ideas from `getPersonalizedIdeas`.
   - `WorkspaceShell.tsx`:
     - Desktop top navigation toggle: "Workspace" (3-pane layout) and "Curated Ideas" (grid layout with live adopted count badge).
     - 5-tab mobile bottom navigation bar (`[Budget, Timeline, Ideas, Style, Summary]`).

3. **1-Click Atomic Shortfall Remedies & Permissive State (`ShortfallBanner.tsx`)**:
   - Explains permissive non-blocking posture (ADR-0002): plan remains fully editable and savable in Infeasible State with allocations clamped to 40% floors.
   - Immediate 1-click action buttons executing calculation remedies without modal traps:
     - Remedy 1 (Increase Budget): *"Add ₹{delta} to Budget"*.
     - Remedy 2 (Reduce Guests): *"Set Guests to {count}"*.
     - Remedy 3 (Trim Flexible Lines): *"Trim Flexible Lines"*.
   - Triggers micro-haptics and atomic update upon click.

4. **Seasonal Advisory Banner & Calm Compressed Mode (`SeasonalAdvisoryBanner.tsx`, `MilestoneBand.tsx`, `TimelineSection.tsx`)**:
   - `SeasonalAdvisoryBanner` mounted atop Timeline tab: ambient festive card displaying detected seasonal risks (Saya dates, monsoon, heat, holiday clash) with `+30d peak buffer` badges.
   - `MilestoneBand`: renders `+{task.bufferDays}d peak buffer` badges on affected milestone tasks and contextual risk pills `[ {task.environmentalRisk} ]`.
   - Calm Compressed Planning Mode banner in warm Marigold/Plum styling replacing alarmist warnings: *"Compressed Planning Mode: Immediate Action items for this week organized strictly by critical path blockers"* (ADR-0005, D-12).

5. **Tier 1 Floating Instant Undo Action Bar (`UndoActionBar.tsx`, `PlanWorkspace.tsx`)**:
   - Floating pill fixed at `bottom-20 left-1/2 -translate-x-1/2 z-50` with Royal Plum ink, Marigold highlights, and 8-second animated countdown progress bar.
   - Displays clear human-readable feedback (e.g. *"Adopted Kulhad Chai Bar (-₹15,000)"*, *"Applied remedy: Added ₹45,000 to Budget"*).
   - 1-click "Undo" button restores the prior immutable snapshot immediately with atomic synchronization and commit.
   - Dismisses cleanly on timeout, manual close, or subsequent user actions.

## Verification

- `pnpm vitest run tests/components/BudgetLineCard.test.tsx`: 4 passed (100%)
- `pnpm vitest run tests/components/CuratedIdeas.test.tsx`: 4 passed (100%)
- `pnpm vitest run tests/components/WorkspaceShell.test.tsx`: 5 passed (100%)
- `pnpm vitest run tests/components/ShortfallBanner.test.tsx`: 3 passed (100%)
- `pnpm vitest run tests/components/UndoActionBar.test.tsx`: 6 passed (100%)
- `pnpm vitest run tests/components/PlanWorkspace.test.tsx`: 11 passed (100%)
- **Full Project Test Suite**: `pnpm vitest run`: 36 test files passed, 239 tests passed, 0 failures.
