---
phase: 6
slug: quarantined-quote-check-closed-registry-generative-ui
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-28
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.0.0 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test tests/engine/quote-guard.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test` on affected test suite
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | QUOTE-01, QUOTE-02 | T-06-01 | XML quote quarantine sandbox with zero tools and strict Zod schema | unit | `pnpm test tests/ai/quote-analyst.test.ts` | ✅ | ✅ green |
| 06-01-02 | 01 | 1 | QUOTE-03 | T-06-02 | Two-phase Verbatim Evidence Guard rejects unanchored figures | unit | `pnpm test tests/engine/quote-guard.test.ts` | ✅ | ✅ green |
| 06-01-03 | 01 | 1 | QUOTE-04 | T-06-03 | Category omission engine detects missing GST, generator, overtime | unit | `pnpm test tests/engine/omission-rules.test.ts` | ✅ | ✅ green |
| 06-02-01 | 02 | 2 | QUOTE-05, QUOTE-06 | T-06-04 | Committing quote locks budget line, computes variance, funds excess | unit | `pnpm test tests/engine/quote-commitment.test.ts` | ✅ | ✅ green |
| 06-02-02 | 02 | 2 | QUOTE-05, QUOTE-06 | T-06-05 | Interactive Quote Check card displays tiers, adders, and live preview | component | `pnpm test tests/components/QuoteCheckCard.test.tsx` | ✅ | ✅ green |
| 06-03-01 | 03 | 3 | GENUI-01, GENUI-02 | T-06-06 | Entity ID Binding rejects numeric amounts/dates in props | unit | `pnpm test tests/ai/generative-ui.test.ts` | ✅ | ✅ green |
| 06-03-02 | 03 | 3 | GENUI-01, GENUI-03 | T-06-07 | 4 Allowlisted components render with live Plan entity resolution | component | `pnpm test tests/components/GenerativeUI.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/ai/quote-analyst.test.ts` — stubs for prompt quarantine & fallback ladder
- [x] `tests/engine/quote-guard.test.ts` — stubs for verbatim substring & numeric parsing
- [x] `tests/engine/omission-rules.test.ts` — stubs for GST & unstated fee detections
- [x] `tests/engine/quote-commitment.test.ts` — stubs for budget locking & elastic displacement

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File upload visual drag-and-drop | QUOTE-01 | Browser file picker interaction | Drop sample invoice screenshot on QuoteIntakeSheet dropzone |
| Celebratory toast and micro-motion | QUOTE-06 | Visual animation & haptic feedback | Click "Commit Quote" on tier card and verify toast / vibration |
| Smart Inspector sheet slide-in | GENUI-01 | CSS transform & Framer motion animation | Trigger layout switch and observe smooth drawer transition |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-28

