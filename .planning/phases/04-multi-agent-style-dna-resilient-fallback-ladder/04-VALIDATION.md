---
phase: 4
slug: multi-agent-style-dna-resilient-fallback-ladder
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-27
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.0.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/engine/style.test.ts` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/engine/style.test.ts`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | VIBE-01 | T-04-01 | Swatch registry has valid ids and bounds | unit | `pnpm vitest run tests/engine/swatches.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | VIBE-03 | T-04-02 | Zod schema rejects identity/demographics | unit | `pnpm vitest run tests/engine/style-schema.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | VIBE-04 | T-04-03 | Multipliers clamped to [0.75, 1.25], paise sum exact | unit | `pnpm vitest run tests/engine/style.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | GENUI-03 | T-04-04 | Tier 1 schema error triggers repair retry | unit | `pnpm vitest run tests/ai/orchestrator.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | GENUI-03 | T-04-05 | 8s timeout cascades to Tier 2 and Tier 3 | unit | `pnpm vitest run tests/ai/orchestrator.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | GENUI-03 | T-04-06 | Missing API key seamlessly runs Tier 3 heuristic | unit | `pnpm vitest run tests/ai/orchestrator.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | VIBE-01 | — | 6–8 counter enforcement and preset filters | component | `pnpm vitest run tests/components/VibeIntake.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | VIBE-02 | — | Step 3B captures moment and 3 trade-offs | component | `pnpm vitest run tests/components/VibeIntake.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 3 | VIBE-04 | — | StyleDNACard renders sliders, retune & reset actions | component | `pnpm vitest run tests/components/StyleDNACard.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/engine/swatches.test.ts` — stubs for VIBE-01 swatch catalog
- [ ] `tests/engine/style.test.ts` — stubs for VIBE-04 modulation engine & paise invariants
- [ ] `tests/ai/orchestrator.test.ts` — stubs for GENUI-03 three-tier fallback ladder & telemetry
- [ ] `tests/components/VibeIntake.test.tsx` — stubs for VIBE-01 & VIBE-02 intake wizard
- [ ] `tests/components/StyleDNACard.test.tsx` — stubs for VIBE-04 & GENUI-03 workspace card & calm degradation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two-beat v2 reveal bar springs | VIBE-04 | Visual animation fluidity | Verify smooth 1.2s bar re-balancing and reduced-motion zero-delay snap in browser |
| Style Swatch visual richness | VIBE-01 | Visual design polish | Check that all 24 swatches render with proper festive tones and SVG fallbacks |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-27 (gsd-planner)

