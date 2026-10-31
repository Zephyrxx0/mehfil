# 11. Abuse Limits Shared Through Postgres

Extends ADR-0010. The rate limiter and the daily model-call cap count in Postgres, so one count holds across every server instance, and plan creation throttles itself.

## Context

Both limits lived in each server instance's memory. That is exact for one instance, but serverless hosting runs several warm instances at once, so the real ceiling was `limit x instances`. The daily cap on paid Gemini calls, whose whole purpose is to bound the bill, was the weakest of them. Separately, `create_event` can be called by anyone holding the public key and was only size-limited.

## Decision

1. **Counters live in two closed tables**, `rate_limit_hits` and `model_usage`, with row-level security on, no policies and privileges revoked, like every other table (ADR-0010).
2. **`consume_rate_limit(bucket, limit, window)` and `consume_model_call(cap)` are granted to the service role only.** They take an arbitrary bucket name. If the public key could call them, anyone could fill a victim's bucket to lock them out, or burn the whole daily model allowance. The server calls them with `SUPABASE_SERVICE_ROLE_KEY`, a server-only variable that is never prefixed `NEXT_PUBLIC_`. A test fails if any file other than the two that need it reads it, or if a client component imports them.
3. **The window is exact and concurrency-safe.** A sliding window over rows, serialised per bucket by an advisory lock. The daily cap is one `INSERT ... ON CONFLICT DO UPDATE ... WHERE calls < cap`, so the check and the increment are a single statement and the count can never pass the cap.
4. **Falling back is part of the design.** Without the service key the same limits run in memory (exact for one instance, which is local use). If the database fails, the limiter answers from memory and rests the database for 30 seconds, so a database fault weakens protection to per-instance but never removes it, and never makes each request wait on a timeout. Service calls time out after 1.5 s.
5. **Client addresses are stored as a keyed hash**, HMAC-SHA-256 with the service key, truncated. Addresses are personal data, and a plain hash of an IPv4 address can be reversed by trying all 2^32 of them.
6. **`create_event` is a circuit breaker.** After validation it takes one hit from a global `create_event:all` bucket: at most 300 plans per rolling 10 minutes across everyone, otherwise SQLSTATE `53400`. Malformed requests do not use up the allowance. The app treats that code as "throttled", not as a fault, and keeps the plan on the visitor's device, fully usable, until the window passes.

## Consequences

- With the service key set, `MODEL_DAILY_CAP` is the true daily ceiling and a client's rate limit holds across instances.
- Turning this on needs one extra server secret. Everything still works without it.
- Each rate-limited request adds one database round-trip when the shared counters are on.
- The circuit breaker bounds how fast storage can grow if plan creation is scripted. **It cannot tell callers apart**, because the database only sees the shared public key, so a flood can make everyone else fall back to local plans for a few minutes. Per-client limits on creation need a server route that sees the real client address, and a distributed flood needs a CAPTCHA or the platform's firewall. Both are hosting decisions.
- A leaked service key is high impact: it bypasses row-level security. It is used for these two functions only, and should be rotated if exposed.
