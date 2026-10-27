# Phase 5: Budget Invariants, Protected Moments & Idea Displacement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-27
**Phase:** 5-Budget Invariants, Protected Moments & Idea Displacement
**Areas discussed:** Curated Idea Catalog & Adoption UI, Donor Line Displacement Visualization, Environmental Date Risks & Weather Advisories, Permissive Shortfall Remedies Execution

---

## Curated Idea Catalog & Adoption UI

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated "Curated Ideas" tab / sheet | WorkspaceShell sheet/tab with category filters | ✓ |
| Inline idea suggestion cards | Embedded directly inside matching BudgetLineCards | |
| Hybrid inline + drawer | Top 1-2 suggestions inline + explore all drawer | |

**User's choice:** Dedicated "Curated Ideas" tab / sheet in WorkspaceShell with category filters  
**Idea Curation Engine:** Hybrid Curated Engine (structured ideas catalog filtered by Style DNA & Event Type, with AI personalization of descriptions and nuance notes)  
**Adoption Interaction:** Direct toggle switch on Idea Card with live re-balancing, animated donor deductions, and immediate Undo pill in bottom bar  
**Ceiling Handling:** Permissive Shortfall (ADR-0002) — allows adoption, entering Infeasible State with Shortfall Banner and 3 remedies if elastic line floors are hit

---

## Donor Line Displacement Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Inline Donor Tags | Donor BudgetLineCards show deduction badges (e.g. "-₹15,000 for Chai Bar") | ✓ |
| Adopted Idea Trade-off Card | Inside Idea Card, display a compact "Funded by" list | |
| Both | Pill list on Idea Card PLUS deduction badge on BudgetLineCards | |

**User's choice:** Inline Donor Tags on donor BudgetLineCards  
**Mathematical Trim Order:** Strict Elasticity Rank Order (BUDGET-04) — drain lowest elasticity lines first (Misc -> Entertainment -> Decor) down to 40% floor before touching next  
**Restoration (Undo):** Exact Inverse Reversion (IDEA-03) — restoring exact paise amounts back to original donor lines in reverse order  
**Protected Moment Immunity Feedback:** Micro-haptic feedback (`navigator.vibrate`) + Gulabi Rose lock shimmer + clear tooltip "Protected Moment is mathematically immune to displacement" (ADR-0004)

---

## Environmental Date Risks & Weather Advisories

| Option | Description | Selected |
|--------|-------------|----------|
| Both ambient banner + inline pills | Seasonal overview banner atop Timeline + contextual pills on milestone cards | ✓ |
| Inline only | Badges on affected milestone task cards only | |
| Top banner only | Dismissible seasonal overview card only | |

**User's choice:** Both ambient banner atop Timeline tab + inline advisory pills on affected milestone cards  
**Calendar Engine Rules:** Full Indian Celebration Rules (Peak Saya/Muhurat dates Nov-Feb & Apr-May, Monsoon outdoor risks Jun-Aug, Summer heat May-Jun, and major national holidays)  
**Lead-Time Impact:** Dynamic Lead-Time Buffers — automatically expand task lead-days during peak seasons (e.g. venue 180d -> 210d) with a "+30d peak buffer" badge  
**Compressed Mode Triage:** Calm Triage Banner (ADR-0005) — warm Marigold/Plum banner highlighting "Compressed Planning Mode: Immediate Action items for this week" (no panic-inducing red alerts)

---

## Permissive Shortfall Remedies Execution

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate Atomic Update | 1-click execution recalculates lines, restores feasibility, records version snapshot | ✓ |
| Interactive Confirmation Sheet | Opens sheet detailing line changes with confirmation action | |
| Inline Preview | Remedy card expands with before-and-after numbers | |

**User's choice:** Immediate Atomic Update  
**Reversibility / Undo:** Two-Tier Undo — immediate "Undo Remedy" pill in bottom bar + permanent version rollback in history drawer  
**Remedy 3 Trim Algorithm:** Targeted Sequential Trim (BUDGET-04) — trim flexible lines in strict elasticity order only until the exact deficit is covered  
**Infeasible Plan Persistence:** Non-Blocking Persistence (ADR-0002) — save and sync normally; share links and exports carry a calm advisory pill stating unallocated deficit

---

## the agent's Discretion

- Visual styling details of Idea Cards, Devanagari flourishes, and badge iconography following `DESIGN.md`.
- Catalog items across archetypes and cultural nuances (e.g. Chai Cart, Live Shehnai, Jali Photo Booth, Vintage Car Entry, Mithai Station).
- Date bounding for peak Saya dates and regional weather alerts.

## Deferred Ideas

- None noted. All requirements scoped strictly to Phase 5.

