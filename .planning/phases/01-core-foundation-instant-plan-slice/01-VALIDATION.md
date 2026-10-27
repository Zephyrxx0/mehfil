---
phase: 1
slug: core-foundation-instant-plan-slice
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x / node:test |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test:run` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | BUDGET-01 | T-01-01 | All allocations strictly sum to total budget in integer paise | unit | `pnpm test src/lib/engine/budget.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | BUDGET-02, MOMENT-01 | T-01-02 | Guest increase scales per-guest lines, clamps elastic lines at 40%, preserves Protected Moment | unit | `pnpm test src/lib/engine/budget.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | BRIEF-02 | T-01-03 | Archetype instant v1 baseline instantiates in <10ms | unit / bench | `pnpm test src/lib/engine/archetypes.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | TIME-01 | T-01-04 | Backwards topological timeline dates correctly calculated from event date | unit | `pnpm test src/lib/engine/timeline.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | TIME-04 | T-01-05 | RFC 5545 .ics generation produces valid calendar with 9:00 AM alarms | unit | `pnpm test src/lib/engine/ics.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | BRIEF-01, BRIEF-03 | T-01-06 | 3-step intake modal validates input and triggers instant baseline | component / unit | `pnpm test src/components/intake/BriefModal.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test runner configuration
- [ ] `src/lib/engine/budget.test.ts` — unit tests for integer paise, largest remainder, guest scaling, 40% floor
- [ ] `src/lib/engine/timeline.test.ts` — unit tests for backwards milestone scheduler and compressed triage
- [ ] `src/lib/engine/ics.test.ts` — unit tests for RFC 5545 calendar export
- [ ] Framework install: `pnpm add -D vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 300ms celebration reveal feel | D-04 | Animation perception and tactile timing | Open modal in browser, submit brief, verify smooth pulse transition |
| Workspace responsive layout | D-01 | Visual layout across mobile and desktop viewport | Check workspace at 375px mobile and 1440px desktop |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-10-27

