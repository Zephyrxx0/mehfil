---
phase: 2
slug: festive-design-system-centerpiece-kinetic-hero
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-27
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.0.0 with Happy-DOM & React Testing Library |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test run` |
| **Estimated runtime** | ~2.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test run`
- **Before `/gsd-verify-work`:** Full suite must be green (all existing 46 Phase 1 tests + new Phase 2 test suites)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DESIGN-01 | — | N/A | unit | `pnpm test tests/design/tokens.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DESIGN-01 | — | N/A | unit | `pnpm test tests/components/ui/` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | DESIGN-02 | — | N/A | component | `pnpm test tests/components/Hero.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | DESIGN-02 | — | N/A | component | `pnpm test tests/components/Hero.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | DESIGN-03 | — | N/A | component | `pnpm test tests/components/WorkspaceShell.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | DESIGN-03 | — | N/A | integration | `pnpm test tests/components/WorkspaceShell.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/setup.ts` — Mock `Element.prototype.setPointerCapture` and `canvas.getContext('2d')` for happy-dom environment
- [ ] `tests/design/tokens.test.ts` — Contrast calculations and anti-pattern static scanner
- [ ] `tests/components/Hero.test.tsx` — Stubs for Hero entrance, sentiment roll, and reduced-motion
- [ ] `tests/components/WorkspaceShell.test.tsx` — Stubs for 3-pane desktop and 4-tab mobile drawer

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canvas micro-motion 60fps fluidity | DESIGN-02 | Browser rendering pipeline frame-pacing | Open localhost:3000 in browser, verify petal animation is smooth without cursor latency |
| Desktop mouse parallax tilt | DESIGN-02 | Hardware pointer event visual feel | Move mouse across hero, verify subtle mandala tilt |
| Mobile bottom sheet swipe gesture | DESIGN-03 | Touch drag physics | Open mobile viewport in DevTools, drag drawer handle up/down |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-10-27

