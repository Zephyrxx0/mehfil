# 6. Dual-Link Capability Model for Accountless Cross-Device Access

Mehfil uses Supabase anonymous authentication combined with a dual-link capability URL model (Organizer Edit Key vs. Family Share Link) to provide cross-device access and sharing with zero login friction.

## Context

Target users are non-technical family organizers and community volunteers planning emotional life milestones. Traditional auth flows (passwords, email verification loops, social logins) cause immediate drop-off and friction during family discussions. However, planning on a desktop and continuing on a mobile phone—or sharing with a spouse or co-organizer—is a fundamental requirement.

## Decision

1. **Anonymous Foundation**: Visitors receive an anonymous Supabase session mapping to an isolated user ID under PostgreSQL Row-Level Security (RLS).
2. **Organizer Edit Key**: The creator is provided with a private capability URL embedding a high-entropy secret token. Opening this URL on another browser claims the session, restoring edit authority without passwords.
3. **Family Share Link**: A separate, publicly shareable link backed by a one-way hashed token renders a sanitized, read-only view of the latest accepted plan version. Sensitive vendor quotes, messy negotiation notes, and internal buffers are stripped by server-side query filters.

## Consequences

- Eliminates auth drop-off completely.
- Preserves strong row-level isolation and server-side security.
- Organizers are responsible for bookmarking or sharing their edit URL to resume across devices.
