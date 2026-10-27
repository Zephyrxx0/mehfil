# Phase 3: Anonymous Persistence & Dual-Link Collaboration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-27
**Phase:** 03-Anonymous Persistence & Dual-Link Collaboration
**Areas discussed:** Capability Keys & Cross-Device Claiming, Family Share Link Experience, Version Snapshot Granularity & Undo, Local Fallback & Sync Feedback

---

## Capability Keys & Cross-Device Claiming

| Option | Description | Selected |
|--------|-------------|----------|
| Top-bar 'Share & Save' trigger | Modal featuring 1-click Copy, QR Code for phone camera scanning, and WhatsApp self-share button. | ✓ |
| Persistent toast/banner | Stays until copied or dismissed, providing immediate reassurance. | |
| Minimalist copy-icon button | Direct icon button in URL/breadcrumb header with no modal. | |

**User's choice:** Top-bar 'Share & Save' trigger with modal featuring 1-click Copy, QR Code for phone camera scanning, and WhatsApp self-share button.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic seamless claim | URL `/plan/[id]?key=[token]` validates token against database, claims edit authority into session/cookie, and strips secret from URL query params (via router.replace). | ✓ |
| Pre-flight welcome dialog | Shows 'Welcome back organizer! Resume editing [Event Title]' with 'Continue' button before entering workspace. | |
| You decide | The agent discretion on safest token persistence & URL cleanup. | |

**User's choice:** Automatic seamless claim — URL `/plan/[id]?key=[token]` validates token against database, claims edit authority into session/cookie, and strips secret from URL query params (via router.replace) to prevent accidental shoulder-surfing or URL sharing.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful downgrade to Read-Only | Opens the plan in view-only mode, and displays an 'Enter Edit Key' dialog for organizers who forgot to append their token. | ✓ |
| Strict Access Shield | Displays a calm 'Organizer Edit Key Needed' modal with a token paste input, without exposing any plan details. | |
| Redirect to Home (`/`) | Toast notification ('Plan not found or unauthorized'). | |

**User's choice:** Graceful downgrade to Read-Only with an 'Unlock Editing' badge — opens the plan in view-only mode, and displays an 'Enter Edit Key' dialog for organizers who forgot to append their token.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Secure 32-byte URL-safe nanoid/token | Stored as a SHA-256 hash in Postgres `events.edit_key_hash` (constant-time comparison) to protect against DB read leaks, with clean URL format `mehfil.app/plan/[id]?key=[token]`. | ✓ |
| Dual distinct slug URLs | `/plan/[edit_token]` for organizer and `/share/[share_token]` for family, with tokens stored directly in indexed columns. | |
| You decide | The agent discretion on cryptographic token storage and URL schema. | |

**User's choice:** Secure 32-byte URL-safe nanoid/token stored as a SHA-256 hash in Postgres `events.edit_key_hash` (constant-time comparison) to protect against DB read leaks, with clean URL format `mehfil.app/plan/[id]?key=[token]`.

---

## Family Share Link Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Celebratory Editorial Overview | Warm, inviting life-milestone presentation featuring event countdown, category breakdown, Protected Moment showcase, and key timeline milestones, without intimidating workspace sliders or editing chrome. | ✓ |
| Read-Only Workspace Mirror | Reuses 3-pane desktop / 4-tab mobile layout with sliders and inputs replaced by static read-only numbers and floating 'Viewing as Family Member' pill. | |
| Minimal Timeline-First Card | Compact single-column mobile-first schedule card focusing purely on event date, itinerary, and venue details. | |

**User's choice:** Celebratory Editorial Overview — A warm, inviting life-milestone presentation featuring event countdown, category breakdown, Protected Moment showcase, and key timeline milestones, without intimidating workspace sliders or editing chrome.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side sanitization | Shows category totals & timeline, but strictly stripping vendor quote breakdowns, negotiation notes, and internal contingency buffers from the DB response payload. | ✓ |
| Strict No-Budget Mode | Completely hides all monetary figures and paise amounts from the share view, showing only celebratory itinerary, venues, and milestones. | |
| Organizer toggle in Share Modal | Defaults to sanitized category totals with an option to toggle 'Hide monetary amounts for family' before copying link. | |

**User's choice:** Server-side sanitization showing category totals & timeline, but strictly stripping vendor quote breakdowns, negotiation notes, and internal contingency buffers from the DB response payload.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Filtered Guest Calendar Export | 1-click 'Add to Calendar' button that generates an `.ics` containing only celebration ceremony dates and public milestones (stripping vendor booking/payment deadlines). | ✓ |
| Full Calendar Export | Exports all milestone bands exactly as defined in the plan. | |
| No calendar export on share page | Keep share link strictly as a visual presentation card. | |

**User's choice:** Filtered Guest Calendar Export — 1-click 'Add to Calendar' button that generates an `.ics` containing only celebration ceremony dates and public milestones (stripping vendor booking/payment deadlines).

---

| Option | Description | Selected |
|--------|-------------|----------|
| 'Regenerate Link' button in Share Modal | Immediately generates a fresh share token and updates `events.share_key_hash`, instantly invalidating any previously distributed links with a calm 'Link Expired' screen. | ✓ |
| Permanent link per event | The share token remains constant for the lifetime of the event without revocation option. | |
| You decide | The agent discretion on revocation ergonomics. | |

**User's choice:** 'Regenerate Link' button in Share Modal — Immediately generates a fresh share token and updates `events.share_key_hash`, instantly invalidating any previously distributed links with a calm 'Link Expired' screen.

---

## Version Snapshot Granularity & Undo

| Option | Description | Selected |
|--------|-------------|----------|
| Interaction-commit with 800ms debounce | Live UI responds instantly (<10ms), while an immutable version record is written to Supabase on interaction end (`onPointerUp`, input `onBlur`, or 800ms idle) with a consolidated change explanation. | ✓ |
| Explicit 'Create Snapshot' button | Sliders update a temporary working state; user explicitly clicks 'Commit Version' when happy with numbers. | |
| You decide | The agent discretion on debounce and transaction boundaries. | |

**User's choice:** Interaction-commit with 800ms debounce — Live UI responds instantly (<10ms), while an immutable version record is written to Supabase on interaction end (`onPointerUp`, input `onBlur`, or 800ms idle) with a consolidated change explanation.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pure append-only forward restore | Clicking Undo generates `v(N+1)` whose state matches `v(N-1)`, logging 'Reverted to v{N-1} ({reason})' so history is completely immutable and audit-trailed. | ✓ |
| Linear pointer with forward truncation | Undo moves active pointer back to `v(N-1)`; any new modification truncates subsequent versions. | |
| Dual undo/redo stack in browser | Browser stack with asynchronous sync. | |

**User's choice:** Pure append-only forward restore — Clicking Undo generates `v(N+1)` whose state matches `v(N-1)`, logging 'Reverted to v{N-1} ({reason})' so history is completely immutable and audit-trailed.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reverse-chronological history cards in Pane 3 / Bottom Sheet | Timestamp, plain-language change summary, and 1-click 'Restore this version' button on any past snapshot. | ✓ |
| Dedicated 'Version History' slide-over drawer | Visual before/after number diff comparison before committing restore. | |
| Single-step undo banner only | Keeps sidebar minimalist. | |

**User's choice:** Reverse-chronological history cards in Pane 3 (desktop) / Bottom Sheet (mobile) with timestamp, plain-language change summary, and 1-click 'Restore this version' button on any past snapshot.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pure TypeScript deterministic diff engine | Generates exact plain-language sentences directly from integer paise deltas ('Scaled Catering by ₹X by drawing from Decor (-₹Y) and Sound (-₹Z); Protected Moment held firm') with zero LLM latency and 100% mathematical fidelity. | ✓ |
| Hybrid approach | Deterministic figures with LLM-polished narrative tone. | |
| You decide | The agent discretion on diff generator implementation. | |

**User's choice:** Pure TypeScript deterministic diff engine — Generates exact plain-language sentences directly from integer paise deltas ('Scaled Catering by ₹X by drawing from Decor (-₹Y) and Sound (-₹Z); Protected Moment held firm') with zero LLM latency and 100% mathematical fidelity.

---

## Local Fallback & Sync Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Local-first resilience | When offline or if Supabase keys are not configured, automatically persist events and version history to localStorage, enabling full planning and seamless auto-sync when cloud is available. | ✓ |
| Read-only demo warning | Display banner 'Database not connected: Changes are temporary' and disable cloud link generation until keys supplied. | |
| You decide | The agent discretion on offline storage adapter. | |

**User's choice:** Local-first resilience — When offline or if Supabase keys are not configured, automatically persist events and version history to localStorage, enabling full planning and seamless auto-sync when cloud is available.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Top-bar subtle status badge | Gentle indicator (`● Saved to Cloud` / `○ Syncing...` / `⚡ Saved Locally`) with subtle checkmark animation providing immediate organizer peace of mind. | ✓ |
| Sidebar version header tag | Embeds sync status directly beside 'Version v3' tag in Pane 3. | |
| Floating bottom-right indicator toast | Auto-fades after sync completes. | |

**User's choice:** Top-bar subtle status badge — Gentle indicator (`● Saved to Cloud` / `○ Syncing...` / `⚡ Saved Locally`) with a subtle checkmark animation providing immediate organizer peace of mind.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Optimistic concurrency with polite banner | If an incoming save detects newer version in database (`parent_version_id` mismatch), display calm banner: 'Plan updated from another device — Refresh to see latest or commit as new version'. | ✓ |
| Silent last-write-wins append | Automatically appends as latest version without interrupting organizer. | |
| You decide | The agent discretion on conflict mechanics. | |

**User's choice:** Optimistic concurrency with polite banner — If an incoming save detects a newer version in the database (`parent_version_id` mismatch), display a calm banner: 'Plan updated from another device — Refresh to see latest or commit as new version'.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Standard `supabase/migrations/` migration file | Complete RLS policies, indexes, and auto-generated TypeScript contracts in `src/types/database.ts` plus local seed file. | ✓ |
| Embedded schema in `src/lib/supabase/schema.sql` | Inline TypeScript types in `src/lib/supabase/types.ts`. | |
| You decide | The agent discretion on migration and types structure. | |

**User's choice:** Standard `supabase/migrations/` migration file with complete RLS policies, indexes, and auto-generated TypeScript contracts in `src/types/database.ts` plus a local seed file.

---

## the agent's Discretion

- Nanoid generation utilities and SHA-256 web crypto helper implementations.
- QR Code rendering library or SVG generation for the share modal.
- Transition animations and toast durations for the sync status pill.
- Supabase client initialization helper supporting both server and client components in Next.js 15.

## Deferred Ideas

- None — discussion stayed within phase scope.

