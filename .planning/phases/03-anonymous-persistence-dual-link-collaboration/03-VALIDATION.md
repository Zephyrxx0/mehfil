---
phase: 03
slug: anonymous-persistence-dual-link-collaboration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-27
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.0.0 with @testing-library/react and happy-dom |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green (all existing 89 tests + new Phase 3 tests)
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | COLLAB-01 | T-03-01 | Anon session created with UUID; RLS blocks cross-tenant reads | unit | `pnpm vitest run tests/storage/supabase-auth.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | COLLAB-02 | T-03-02 | 32-byte nanoid generates 64-char SHA-256 hash | unit | `pnpm vitest run tests/storage/capability-keys.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | COLLAB-02 | T-03-03 | Edit claim sets cookie & strips query param via router.replace | unit / component | `pnpm vitest run tests/components/CapabilityRouter.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | COLLAB-03 | T-03-04 | Sanitization strips vendor quotes, notes & contingency buffers | unit | `pnpm vitest run tests/engine/sanitization.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | COLLAB-03 | T-03-05 | Filtered guest .ics exports ceremonies only | unit | `pnpm vitest run tests/components/FamilyShareView.test.tsx` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | COLLAB-04 | T-03-06 | Deterministic diff engine produces exact sentences from paise deltas | unit | `pnpm vitest run tests/engine/diff.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | COLLAB-04 | T-03-07 | Undo creates forward version v(N+1) matching v(N-1) without deletes | unit | `pnpm vitest run tests/storage/versioning.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/storage/supabase-auth.test.ts` — stubs for COLLAB-01
- [ ] `tests/storage/capability-keys.test.ts` — stubs for COLLAB-02 crypto & token hashing
- [ ] `tests/components/CapabilityRouter.test.tsx` — stubs for COLLAB-02 route claim & URL cleanup
- [ ] `tests/engine/sanitization.test.ts` — stubs for COLLAB-03 plan sanitization
- [ ] `tests/components/FamilyShareView.test.tsx` — stubs for COLLAB-03 view & filtered calendar export
- [ ] `tests/engine/diff.test.ts` — stubs for COLLAB-04 deterministic diff engine
- [ ] `tests/storage/versioning.test.ts` — stubs for COLLAB-04 append-only versioning & forward restore

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-device mobile scanning | COLLAB-02 | Hardware phone camera scanning QR code | Open desktop `/plan/[id]`, open Share Modal, scan QR code with phone, verify plan opens with edit access |
| WhatsApp share preview | COLLAB-03 | External WhatsApp Web/App dispatcher | Click WhatsApp share button, verify prefilled invitation text and share URL format |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

