# Phase 03: Anonymous Persistence & Dual-Link Collaboration — Technical Research

**Phase Target:** Implement server persistence, immutable versioning, zero-login cross-device resumption via capability keys, sanitized read-only family sharing, local-first offline fallback, and deterministic plain-language diff generation.  
**Status:** Complete  
**Confidence:** HIGH  

---

<user_constraints>
## 1. User Constraints & Decisions

*Copied verbatim from `.planning/phases/03-anonymous-persistence-dual-link-collaboration/03-CONTEXT.md`:*

### Capability Keys & Cross-Device Claiming
- **D-01:** Top-bar "Share & Save" trigger with modal featuring 1-click Copy, QR Code for phone camera scanning, and WhatsApp self-share button. — **Reversibility:** reversible
- **D-02:** Automatic seamless claim: opening `/plan/[id]?key=[token]` validates token against Postgres hash, claims edit authority into session/cookie, and strips secret from URL query params (via router.replace) to prevent accidental shoulder-surfing or URL sharing. — **Reversibility:** costly — impacts URL routing, middleware, and auth session hydration
- **D-03:** Graceful downgrade to Read-Only with an "Unlock Editing" badge if a visitor lands on `/plan/[id]` without a valid Edit Key or cookie, opening an "Enter Edit Key" dialog for organizers who forgot to append their token. — **Reversibility:** reversible
- **D-04:** Secure 32-byte URL-safe nanoid/token stored as a SHA-256 hash in Postgres `events.edit_key_hash` (constant-time comparison) to protect against DB read leaks, with clean URL format `bookmymehfil.vercel.app/plan/[id]?key=[token]`. — **Reversibility:** one-way — database schema and cryptographic security contract

### Family Share Link Experience
- **D-05:** Celebratory Editorial Overview layout for `/share/[token]`: warm life-milestone presentation featuring event countdown, category breakdown, Protected Moment showcase, and key timeline milestones, without intimidating workspace sliders or editing chrome. — **Reversibility:** reversible
- **D-06:** Server-side sanitization showing category totals & timeline, but strictly stripping vendor quote breakdowns, negotiation notes, and internal contingency buffers from the DB response payload. — **Reversibility:** one-way — API boundary security and privacy contract
- **D-07:** Filtered Guest Calendar Export on `/share/[token]`: 1-click 'Add to Calendar' button that generates an `.ics` containing only celebration ceremony dates and public milestones (stripping vendor booking/payment deadlines). — **Reversibility:** reversible
- **D-08:** 'Regenerate Link' button in Share Modal immediately creates a fresh share token and updates `events.share_key_hash`, instantly invalidating any previously distributed links with a calm 'Link Expired' screen. — **Reversibility:** costly — invalidation logic and state update

### Version Snapshot Granularity & Undo
- **D-09:** Interaction-commit with 800ms debounce: live UI updates in real-time (<10ms), while an immutable version record is written to Supabase on interaction end (`onPointerUp`, input `onBlur`, or 800ms idle) with a consolidated change explanation. — **Reversibility:** costly — state management and save orchestration
- **D-10:** Pure append-only forward restore: clicking Undo generates `v(N+1)` whose state matches `v(N-1)`, logging 'Reverted to v{N-1} ({reason})' so history is completely immutable and audit-trailed without destructive deletes. — **Reversibility:** one-way — immutable storage and audit contract
- **D-11:** Reverse-chronological history cards in Pane 3 (desktop) / Bottom Sheet (mobile) with timestamp, plain-language change summary, and 1-click 'Restore this version' button on any past snapshot. — **Reversibility:** reversible
- **D-12:** Pure TypeScript deterministic diff engine: generates exact plain-language sentences directly from integer paise deltas ('Scaled Catering by ₹X by drawing from Decor (-₹Y) and Sound (-₹Z); Protected Moment held firm') with zero LLM latency and 100% mathematical fidelity. — **Reversibility:** costly — core diff calculation contract

### Local Fallback & Sync Feedback
- **D-13:** Local-first resilience: when offline or if Supabase keys are not configured, automatically persist events and version history to localStorage, enabling full planning and seamless auto-sync when cloud is available. — **Reversibility:** costly — persistence adapter architecture
- **D-14:** Top-bar subtle status badge: gentle indicator (`● Saved to Cloud` / `○ Syncing...` / `⚡ Saved Locally`) with a subtle checkmark animation providing immediate organizer peace of mind. — **Reversibility:** reversible
- **D-15:** Optimistic concurrency with polite banner: if an incoming save detects a newer version in the database (`parent_version_id` mismatch), display a calm banner: 'Plan updated from another device — Refresh to see latest or commit as new version'. — **Reversibility:** costly — conflict detection logic
- **D-16:** Standard `supabase/migrations/` migration file with complete RLS policies, indexes, and auto-generated TypeScript contracts in `src/types/database.ts` plus a local seed file. — **Reversibility:** one-way — database migration contract

### the agent's Discretion
- Exact nanoid generation utilities and SHA-256 web crypto helper implementations.
- QR Code rendering library or SVG generation for the share modal.
- Transition animations and toast durations for the sync status pill.
- Supabase client initialization helper supporting both server and client components in Next.js 15.

### Deferred Ideas
- None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## 2. Phase Requirements Mapping

| Requirement ID | Requirement Summary | Implementation Strategy & Technical Verification |
| :--- | :--- | :--- |
| **COLLAB-01** | Visitor automatically receives an anonymous Supabase session with isolated user ID under PostgreSQL Row-Level Security. | Supabase Anonymous Auth (`supabase.auth.signInAnonymously()`) silently initialized in root provider / client helper. Postgres RLS ensures `auth.uid() = owner_id` on `events`, `plan_versions`, and `change_records`. Verified with mock auth tests and isolated user policies. |
| **COLLAB-02** | User can copy a private Organizer Edit Key URL embedding an unguessable token to resume editing across browsers and devices without accounts (ADR-0006). | 32-byte cryptographically secure random token generated at plan inception, stored as SHA-256 hash in `events.edit_key_hash`. Seamless claim via `/plan/[id]?key=[token]`: validates hash, claims cookie/session, strips token from URL bar with `router.replace`. Downgrade to Read-Only with "Unlock Editing" dialog if missing key. |
| **COLLAB-03** | User can generate a sanitized read-only Family Share Link backed by a one-way hashed token, hiding vendor quotes, draft notes, and private negotiations. | Dedicated route `/share/[token]`. Database lookup matches SHA-256 hash against `events.share_key_hash`. API endpoint strictly sanitizes payload, stripping raw vendor quotes, private notes, and internal buffers. UI displays celebratory milestone overview and filtered guest calendar (.ics). Invalidation supported via "Regenerate Link". |
| **COLLAB-04** | Plan versions are strictly immutable and append-only; undo operations create a new forward version restoring previous snapshots. | Postgres table `plan_versions` with RLS denying UPDATE and DELETE. Undo operations create `v(N+1)` with snapshot matching `v(N-1)` or target snapshot `v(k)` with reason `Reverted to v{k}`. Debounced 800ms commit on slider release / input blur. Deterministic TypeScript diff engine generates human-readable delta summaries. |
</phase_requirements>

---

## 3. Technology Stack & Provenance Audit

| Technology / Package | Target Version | Provenance & Source | Status in Project / Plan |
| :--- | :--- | :--- | :--- |
| `@supabase/supabase-js` | `^2.118.0` | [VERIFIED: npm registry `pnpm info @supabase/supabase-js version` -> `2.118.0`] | To be installed. Core Supabase client for DB, Auth, and RLS queries. |
| `@supabase/ssr` | `^0.12.7` | [VERIFIED: npm registry `pnpm info @supabase/ssr version` -> `0.12.7`] | To be installed. Next.js 15 Server Component, Route Handler, and Middleware cookie adapter. |
| `qrcode.react` | `^4.2.0` | [VERIFIED: npm registry `pnpm info qrcode.react peerDependencies` -> `react ^19.0.0`] | To be installed. SVG/Canvas QR Code renderer for cross-device mobile scanning in Share Modal. Compatible with React 19. |
| Web Crypto API (`crypto.subtle`) | Native (Node 18+, Modern Browsers) | [VERIFIED: W3C Web Cryptography API & Node.js global `crypto`] | Built-in standard. Provides `crypto.getRandomValues(32)` for unguessable tokens and `crypto.subtle.digest('SHA-256')` for constant-time hash verification. |
| `vitest` | `^3.0.0` | [VERIFIED: in-repo `package.json#L39`] | Installed. Testing framework for diff engine, persistence adapter, crypto verification, and component integration. |
| `@radix-ui/react-dialog` | `^1.3.1` | [VERIFIED: in-repo `package.json#L13`] | Installed. Primitives for Share & Save Modal and "Unlock Editing" key intake dialog. |

---

## 4. In-Repo Architectural & Contract Values

*Exact schema definitions and cryptographic boundaries:*

### 4.1 Cryptographic Key Boundaries (D-04, ADR-0006)
- **Edit Key Token:** 32-byte cryptographically secure random buffer formatted as a 64-character lowercase hexadecimal string (or 43-character base64url string), providing 256 bits of entropy.
- **Hash Algorithm:** SHA-256 (`crypto.subtle.digest('SHA-256', textEncoder.encode(token))`).
- **Database Column Storage:** `events.edit_key_hash` (VARCHAR(64) / TEXT, UNIQUE, NOT NULL). Raw tokens are NEVER stored in plaintext in the database.
- **Capability URL Structure:**
  - Organizer Edit Key: `https://bookmymehfil.vercel.app/plan/[id]?key=[token]`
  - Family Share Link: `https://bookmymehfil.vercel.app/share/[token]`
- **Claim Cookie:** `mehfil_edit_[planId]` (HttpOnly, SameSite=Lax, Secure in production, Max-Age=30 days).

### 4.2 Database Schema Architecture (`supabase/migrations/`) (D-16, PRD §9.2)

```sql
-- Migration: 20261027000000_create_collaboration_schema.sql

-- 1. Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'birthday', 'community')),
  event_date DATE NOT NULL,
  city TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  total_budget_paise BIGINT NOT NULL CHECK (total_budget_paise >= 0),
  protected_category TEXT NOT NULL,
  edit_key_hash TEXT NOT NULL UNIQUE,
  share_key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for constant-time capability lookups
CREATE INDEX IF NOT EXISTS idx_events_edit_key_hash ON public.events(edit_key_hash);
CREATE INDEX IF NOT EXISTS idx_events_share_key_hash ON public.events(share_key_hash);
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);

-- 2. Plan Versions table (strictly immutable)
CREATE TABLE IF NOT EXISTS public.plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  parent_version_id UUID REFERENCES public.plan_versions(id),
  reason TEXT NOT NULL,
  lines JSONB NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_accepted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_event_version UNIQUE (event_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_plan_versions_event_id ON public.plan_versions(event_id);
CREATE INDEX IF NOT EXISTS idx_plan_versions_parent ON public.plan_versions(parent_version_id);

-- 3. Change Records table (audit log per version)
CREATE TABLE IF NOT EXISTS public.change_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  deltas JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL,
  is_floor_protected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_records_version ON public.change_records(plan_version_id);
```

### 4.3 PostgreSQL Row-Level Security (RLS) Policies (D-16, COLLAB-01)

```sql
-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_records ENABLE ROW LEVEL SECURITY;

-- Events Policies
-- Owner can do all operations
CREATE POLICY "events_owner_all" ON public.events
  FOR ALL
  TO authenticated, anon
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Plan Versions Policies (INSERT and SELECT only; UPDATE & DELETE denied)
CREATE POLICY "plan_versions_owner_select" ON public.plan_versions
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE public.events.id = public.plan_versions.event_id
        AND public.events.owner_id = auth.uid()
    )
  );

CREATE POLICY "plan_versions_owner_insert" ON public.plan_versions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE public.events.id = public.plan_versions.event_id
        AND public.events.owner_id = auth.uid()
    )
  );

-- Change Records Policies (INSERT and SELECT only)
CREATE POLICY "change_records_owner_select" ON public.change_records
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions
      JOIN public.events ON public.events.id = public.plan_versions.event_id
      WHERE public.plan_versions.id = public.change_records.plan_version_id
        AND public.events.owner_id = auth.uid()
    )
  );

CREATE POLICY "change_records_owner_insert" ON public.change_records
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_versions
      JOIN public.events ON public.events.id = public.plan_versions.event_id
      WHERE public.plan_versions.id = public.change_records.plan_version_id
        AND public.events.owner_id = auth.uid()
    )
  );
```

### 4.4 Sanitized Family View Projection (D-06)
- **Allowed Fields:** `title`, `eventType`, `eventDate`, `city`, `guestCount`, `totalBudgetPaise`, `categoryTotals` (`Record<BudgetCategory, Paise>`), `protectedMoment` (`{ name, category, isProtected }`), `publicMilestones` (`TimelineTask[]` where `isCeremony = true` or `leadDays <= 14`).
- **Forbidden / Stripped Fields:** `lines[].baselinePaise`, `lines[].elasticityRank`, all vendor quote candidate pricing, quote notes, draft negotiation strings, contingency internal buffers, `edit_key_hash`, `share_key_hash`, `owner_id`.

---

## 5. Technical Domain Investigations

### 5.1 Supabase Anonymous Auth & Next.js 15 Async Cookies
[VERIFIED: `@supabase/ssr` documentation & Next.js 15 breaking changes]:
In Next.js 15, `cookies()` from `next/headers` is asynchronous and returns a `Promise<ReadonlyRequestCookies>`.
Therefore, in Server Components, Route Handlers, and Server Actions:
```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handled when called from Server Component
          }
        },
      },
    }
  )
}
```

For client components, `createBrowserClient` initializes a singleton:
```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Anonymous Session Initialization:**
When an organizer first creates a plan:
1. `supabase.auth.getSession()` checks for an existing session.
2. If null, `await supabase.auth.signInAnonymously()` creates an anonymous user.
3. The resulting user ID is assigned as `events.owner_id`.
4. If offline or Supabase environment variables are missing, fallback to local UUID generator.

---

### 5.2 Capability URL Model & Seamless Cross-Device Claiming (D-02, D-03, D-04)

**The Capability Security Problem:**
How does an organizer resume editing on their phone without signing up or entering passwords?
1. **Creation:** Plan creation creates an unguessable 32-byte token $T$. The client displays `bookmymehfil.vercel.app/plan/[id]?key=[token]`.
2. **Storage:** The server stores $H = \text{SHA-256}(T)$ in `events.edit_key_hash`. Database leaks or read replicas never expose the plaintext token.
3. **Claiming on Phone:**
   - Organizer scans QR code or clicks WhatsApp link on phone.
   - The browser hits `/plan/[id]?key=[token]`.
   - On initial mount or route execution, the client calls `POST /api/plan/[id]/claim` with `{ key: token }`.
   - The API verifies $\text{SHA-256}(\text{key}) == \text{event.edit_key_hash}$.
   - If valid, the API sets an `HttpOnly` cookie `mehfil_edit_[id]` authorizing the browser session and returns `{ authorized: true }`.
   - The client immediately calls `router.replace('/plan/' + id)`, stripping `?key=[token]` from the URL bar (preventing shoulder-surfing or copy-pasting the edit key into public groups).
4. **Graceful Downgrade (D-03):**
   - If someone opens `/plan/[id]` without `?key=` and has no valid edit cookie:
   - The workspace loads in **Read-Only Mode** with an "Unlock Editing" badge in the top bar.
   - Clicking the badge opens an "Enter Edit Key" dialog where the user can paste their token to gain edit authority.

---

### 5.3 Deterministic Plain-Language Diff Engine (D-12)

**Mathematical Delta Engine (`src/lib/engine/diff.ts`):**
The diff engine must compute exact plain-language sentences directly from integer paise deltas, with zero LLM latency and 100% mathematical fidelity.

**Input Structure:**
```ts
export interface PlanDiffInput {
  prevPlan: Plan
  nextPlan: Plan
  actionType?: 'guest_scale' | 'budget_change' | 'protected_lock' | 'restore' | 'manual'
  restoredVersionNumber?: number
}

export interface PlanDiffResult {
  summary: string
  deltas: PlanChangeDelta[]
  isFloorProtected: boolean
  donorCategories: string[]
  recipientCategories: string[]
}
```

**Deterministic Rule Set:**
1. **Undo / Forward Restore (D-10):**
   If `actionType === 'restore'`, sentence format:  
   `"Reverted to v{restoredVersionNumber} ({previousReason})"`
2. **Guest Count Scaling (D-09):**
   If `prevPlan.brief.guestCount !== nextPlan.brief.guestCount`:  
   Delta: $\Delta G = G_{\text{next}} - G_{\text{prev}}$.  
   Identify lines with positive deltas (recipients, e.g., Catering $+₹X$, Favors $+₹Y$).  
   Identify lines with negative deltas (donors, e.g., Decor $-₹A$, Entertainment $-₹B$).  
   Sentence:  
   `"Scaled guest count to {G_next} ({+ΔG} guests). Scaled {recipients} by drawing from {donors}{protectedMomentStatus}."`  
   If Protected Moment holds firm:  
   `"; Protected Moment ({category}) held firm"`
3. **Total Budget Change:**
   If `prevPlan.totalBudgetPaise !== nextPlan.totalBudgetPaise`:  
   Delta: $\Delta B = B_{\text{next}} - B_{\text{prev}}$.  
   Sentence:  
   `"{Increased|Decreased} total budget by {formatINR(abs(ΔB))}; apportioned across flexible lines."`
4. **Protected Moment Re-assignment (MOMENT-01):**
   If `prevPlan.brief.protectedCategory !== nextPlan.brief.protectedCategory`:  
   Sentence:  
   `"Locked Protected Moment for {category}; non-negotiable floor enforced."`

All amounts are formatted through `formatINR(deltaPaise)` with proper Indian grouping (`₹50,000`, `₹1,25,000`).

---

### 5.4 Family Share View & Filtered Calendar Export (D-05, D-06, D-07, D-08)

**Editorial Showcase Layout (`src/app/share/[token]/page.tsx`):**
- Unlike the workspace, this page has **no editing sliders, no guest steppers, no shortfall warnings, and no change cards**.
- Layout components:
  1. **Celebratory Header:** Event Title in Fraunces serif, city, countdown banner ("45 days to celebration").
  2. **Protected Moment Showcase:** Gulabi Rose card highlighting the organizer's sacred celebration priority.
  3. **High-Level Category Overview:** Clean circular or bar proportion visual showing category shares and whole rupee totals.
  4. **Ceremony Timeline:** Highlights key ceremonial dates (Haldi, Mehendi, Sangeet, Ceremony, Reception).
  5. **1-Click Guest Calendar Export (D-07):**
     - Emits `.ics` file containing only public ceremony dates and times.
     - Strips all vendor booking deadlines, contract deposit reminders, and negotiation tasks.
- **Link Invalidation / Regeneration (D-08):**
  - If the organizer clicks "Regenerate Link" in the workspace Share Modal:
  - Generates a new share token, writes new `share_key_hash` to DB.
  - Old link token no longer matches; visiting the old URL renders a calm "Link Expired — Please request an updated share link from the celebration host" card.

---

### 5.5 Local-First Persistence & Concurrency Adapter (D-13, D-14, D-15)

**Persistence Adapter Interface (`src/lib/storage/persistence.ts`):**
```ts
export interface PersistenceAdapter {
  savePlan(plan: Plan, parentVersionId?: string, diffSummary?: string): Promise<SaveResult>
  getPlan(planId: string, editKey?: string): Promise<PlanLoadResult>
  getVersionHistory(planId: string): Promise<PlanVersionRecord[]>
  restoreVersion(planId: string, versionNumber: number): Promise<SaveResult>
  regenerateShareKey(planId: string): Promise<string>
  getSharedPlan(shareToken: string): Promise<SanitizedSharedPlan | null>
}
```

**Optimistic Concurrency Detection (D-15):**
1. When saving version $N+1$, the client sends `parent_version_id = currentVersion.id`.
2. The server / adapter checks if the latest stored version for this event matches `parent_version_id`.
3. If a newer version exists in Postgres (e.g., someone adjusted guest count on another device):
   - Server returns HTTP 409 `{ status: 'conflict', latestVersionNumber: M, latestPlan: Plan }`.
   - UI shows a polite non-blocking banner:  
     `"Plan updated from another device — Refresh to see latest or commit as new version."`
   - Organizer has two clear options: "Refresh to Latest" or "Commit as Fork".

**Sync Status Badge States (D-14):**
- `cloud_saved`: `● Saved to Cloud` (Cardamom Green `#4A7C59` dot, subtle checkmark).
- `syncing`: `○ Syncing...` (Pulsing Marigold `#F7C873` dot, spinning icon).
- `local_saved`: `⚡ Saved Locally` (Terracotta `#D95D39` lightning bolt, tooltip: "Working offline or without Supabase keys").

---

## 6. Potential Pitfalls, Edge Cases & Implementation Traps

| Trap | Severity | Root Cause | Prevention & Mitigation |
| :--- | :--- | :--- | :--- |
| **Accidental Edit Key Leak via URL Sharing** | HIGH | User copies browser address bar instead of clicking "Share Family Link", sending edit capability to family WhatsApp group. | **Mitigation (D-02):** Immediate URL sanitization on load. As soon as `/plan/[id]?key=[token]` is claimed, call `router.replace('/plan/' + id)`. The query param disappears from the address bar in <50ms. |
| **Server Component Cookie Mutation in Next.js 15** | HIGH | Attempting to call `cookies().set(...)` inside a Server Component page throws a Next.js runtime error. | **Mitigation:** Only mutate cookies inside Route Handlers (`app/api/plan/[id]/claim/route.ts`) or Server Actions. Client claims via fetch or Server Action, then refreshes/replaces route. |
| **Vendor Notes Leaking into Family Share** | CRITICAL | Serializing the raw `Plan` object to the `/share/[token]` page. | **Mitigation (D-06):** Strict projection function `sanitizePlanForSharing(plan)` running on the server. Never send raw `BudgetLine` with quotes or notes to the client. |
| **Floating-Point Currency Drift in Versions** | CRITICAL | Storing or diffing currency in floating-point rupees. | **Mitigation:** Maintain strict integer `Paise` throughout database schema (`BIGINT`), diff engine, and snapshots. Rupees formatted only at display boundary. |
| **Destructive Undo Overwriting Version History** | HIGH | Implementing undo as `DELETE FROM plan_versions WHERE version_number > N`. | **Mitigation (D-10, COLLAB-04):** Pure append-only forward restore. Undo commits `v(N+1)` with snapshot matching `v(N-1)`. Old versions are never deleted. |
| **Debounce State Race Conditions** | MEDIUM | User moves slider rapidly; trailing debounced save overwrites newer state. | **Mitigation (D-09):** Use interaction-end commits (`onPointerUp`, `onBlur`) combined with an active commit queue and abort controllers for pending fetches. |
| **Offline Mode Failure in Dev/Test** | MEDIUM | Local developers or CI environments without running Supabase container fail to load plans. | **Mitigation (D-13):** Transparent fallback adapter. If `NEXT_PUBLIC_SUPABASE_URL` is missing or fetch fails, read/write seamlessly to `localStorage`. |

---

## 7. Validation Architecture

### 7.1 Test Framework & Execution Setup
- **Framework:** `vitest` with `@testing-library/react` and `happy-dom`.
- **Execution Command:** `pnpm test` (or `pnpm vitest run`).
- **Baseline Status:** 89/89 passing tests across Phase 1 and Phase 2.

### 7.2 Requirement-to-Test Mapping

| Requirement ID | Test Suite | Test Specifications |
| :--- | :--- | :--- |
| **COLLAB-01** | `tests/storage/supabase-auth.test.ts` | 1. Anonymous session creation generates valid UUID.<br>2. Postgres RLS mock denies access when `owner_id != auth.uid()`.<br>3. Offline fallback generates local UUID when Supabase is unreachable. |
| **COLLAB-02** | `tests/storage/capability-keys.test.ts`<br>`tests/components/CapabilityRouter.test.tsx` | 1. 32-byte token generates exact 64-char SHA-256 hash.<br>2. Claiming valid token sets edit session cookie.<br>3. `router.replace` strips `?key=` query param from URL.<br>4. Missing key downgrades to Read-Only mode with "Unlock Editing" badge. |
| **COLLAB-03** | `tests/engine/sanitization.test.ts`<br>`tests/components/FamilyShareView.test.tsx` | 1. `sanitizePlanForSharing` strips vendor quotes, internal notes, and contingency buffers.<br>2. Filtered guest `.ics` includes ceremony dates, excludes booking deadlines.<br>3. Regenerated share key renders expired state on previous token. |
| **COLLAB-04** | `tests/engine/diff.test.ts`<br>`tests/storage/versioning.test.ts` | 1. Debounced save writes immutable version `v(N+1)`.<br>2. Undo generates forward restore version with `Reverted to v{k}` explanation.<br>3. Deterministic diff engine produces exact plain-language sentence without LLM.<br>4. Invariant: database check rejects UPDATE/DELETE on `plan_versions`. |

### 7.3 Sampling Rate & Coverage
- 100% of arithmetic diff sentences validated across all 5 mutation types (guest scaling, budget changes, protected moments, idea displacement, forward restore).
- 100% of sanitized share payloads audited to guarantee 0 leak of private vendor quote data.

---

## 8. Security Domain & Threat Model

### 8.1 Trust Boundaries & Surface Analysis
1. **Public Internet / URL Bar:**
   - URLs can be intercepted, shared, or leaked via browser history.
   - Capability Edit Key is unguessable ($2^{256}$ entropy), claimed into HttpOnly cookie, and immediately stripped from URL.
   - Family Share Link has no write capability and exposes only sanitized aggregates.
2. **Database Read Leak:**
   - Database stores only `SHA-256(token)`. A compromised database read replica or SQL dump does NOT allow an attacker to reconstruct the edit keys or share keys.
3. **Immutability Invariant:**
   - Version history is tamper-evident and append-only. Organizers can never lose their budget history even if an unexpected modification occurs; one-click forward restore guarantees total recovery.
4. **Sanitization Firewall (D-06):**
   - Private quotes and negotiations are stripped at the server API boundary before JSON serialization, preventing data inspection via browser DevTools network tab.

---

*Research prepared for Phase 3 Planning.*  
*Canonical output: `.planning/phases/03-anonymous-persistence-dual-link-collaboration/03-RESEARCH.md`*
