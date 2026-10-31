# 6. Dual-Link Capability Model for Accountless Cross-Device Access

Status: Superseded in part by [ADR-0010](0010-token-checked-rpc-persistence.md). The two-link model below still holds. Anonymous Supabase sessions and owner-based row-level security were replaced by token-checked database functions.

Mehfil gives each plan a private organizer edit link and a separate read-only family link, so people get cross-device access and sharing with zero login friction. The first version of this record built that on Supabase anonymous authentication and row-level security (RLS) tied to the signed-in user. That part never worked as written and was replaced by ADR-0010.

## Context

Target users are non-technical family organizers and community volunteers planning emotional life milestones. Traditional auth flows (passwords, email verification loops, social logins) cause immediate drop-off and friction during family discussions. However, planning on a desktop and continuing on a mobile phone—or sharing with a spouse or co-organizer—is a fundamental requirement.

## Decision

1. **Anonymous Foundation**: Visitors receive an anonymous Supabase session mapping to an isolated user ID under PostgreSQL Row-Level Security (RLS). _Superseded by ADR-0010._ No code signs visitors in or sets `owner_id`, so the owner policies denied every direct table access. Migration `20261031000000_token_checked_access.sql` dropped them. The tables now have RLS on, no policies and no privileges for `anon` or `authenticated`, and the browser reaches the data only through `SECURITY DEFINER` functions. There is no anonymous session and no session cookie.
2. **Organizer Edit Key**: The creator is provided with a private capability URL embedding a high-entropy secret token. Opening this URL on another browser claims the session, restoring edit authority without passwords. _Amended:_ the database generates the key with `gen_random_bytes(32)` (256 bits) and stores only its SHA-256 hash. Opening the link posts the key to `/api/plan/[id]/claim`, which asks `verify_edit_key` to check it. If the database accepts it, that browser keeps the key in `localStorage` (`src/lib/storage/capability-store.ts`) and sends it with every save. The database re-checks the key on every call. Nothing is claimed or restored as a session.
3. **Family Share Link**: A separate, publicly shareable link renders a sanitized, read-only view of the latest accepted plan version. Sensitive vendor quotes, messy negotiation notes, and internal buffers are stripped before the page is shown. _Amended:_ the link carries the plain share token. `get_shared_plan` hashes it inside the database, matches it against the stored hash and returns only the event summary and the latest budget lines, never the full snapshot. The family page then runs `sanitizePlanForSharing` (`src/lib/engine/sanitization.ts`) on the server. The organizer can replace the link with `regenerate_share_key`, which needs the edit key and stops the old link at once.

## Consequences

- Eliminates auth drop-off completely.
- Isolation no longer comes from per-user row policies. The tables are closed to the browser's roles, and each function checks the capability token itself (ADR-0010).
- Organizers are responsible for bookmarking or sharing their edit URL to resume across devices.
