---
phase: 5
slug: budget-invariants-protected-moments-idea-displacement
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (v2.x) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test tests/engine/` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test tests/engine/`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | MOMENT-02, BUDGET-04 | — | Protected moment immune to downward re-balancing | unit | `pnpm test tests/engine/displacement.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | IDEA-02, IDEA-03 | — | Zero-sum displacement from elastic lines & exact inverse undo | unit | `pnpm test tests/engine/displacement.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | BUDGET-03 | — | Infeasible state marks shortfall and computes 3 remedies | unit | `pnpm test tests/engine/remedies.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | TIME-02, TIME-03 | — | Environmental calendar risk detection & Compressed Mode triage | unit | `pnpm test tests/engine/calendar-risks.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | IDEA-01 | — | Curated celebration catalog filtering by Style DNA & event type | unit | `pnpm test tests/engine/idea-catalog.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | MOMENT-03 | — | Gulabi rose lock highlight, shimmer, and micro-haptic | component | `pnpm test tests/components/BudgetLineCard.test.tsx` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | IDEA-01, IDEA-02, IDEA-03 | — | Curated Ideas tab, adoption toggle, donor tags, and undo | component | `pnpm test tests/components/CuratedIdeas.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/engine/displacement.test.ts` — unit tests for `adoptIdea`, `retractIdea`, protected moment immunity, strict elasticity order
- [ ] `tests/engine/calendar-risks.test.ts` — unit tests for peak Saya dates, monsoon/heat, holiday clashes, +30d lead buffers
- [ ] `tests/engine/idea-catalog.test.ts` — unit tests for idea curation, Style DNA compatibility, task template generation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Micro-haptic feedback | MOMENT-03 | Mobile hardware sensor | On touch-enabled device, tap Protected Moment lock and confirm tactile vibration occurs |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-10-27

