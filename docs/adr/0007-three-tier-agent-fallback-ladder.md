# 7. Three-Tier Agent Fallback Ladder for Zero-Failure Operations

All agent-invoked workflows operate behind a strict three-tier fallback ladder: primary model self-repair retry (Gemma 4, `gemma-4-31b-it`), secondary cloud escalation (Gemini Flash Lite, `gemini-3.5-flash-lite`), and deterministic archetype degradation.

## Context

In live event planning sessions and judging demos, model rate limits, API latency spikes, or subtle JSON schema validation errors can catastrophically halt user onboarding. A traditional error modal or infinite loading spinner ruins user trust and violates the core tenet of "Calm and festive, not busy."

## Decision

1. **Tier 1 (Self-Repair)**: The first attempt runs at temperature 0.2. If it fails for any reason other than a timeout (a response that is not valid JSON, one that fails the Zod schema, or a provider error), the orchestrator makes a single retry at temperature 0 on the primary model (Gemma 4, `gemma-4-31b-it`). The retry reuses the original prompt plus a fixed repair sentence. The validation error is never fed back, because its text can echo model output derived from untrusted input such as a vendor quote. The retry gets the time left in the budget, but at least 2 seconds (`generateStructuredWithRepair` in `src/lib/ai/structured.ts`; the fixed wording is in `style-analyst.ts`, `quote-analyst.ts` and `layout-ladder.ts`).
2. **Tier 2 (Cloud Escalation)**: If Tier 1 fails, the request is escalated immediately to Gemini Flash Lite (`gemini-3.5-flash-lite`), which gets its own repair retry. Each tier has an 8-second budget (`DEFAULT_TIMEOUT_MS` in `src/lib/ai/ladder.ts`) that its first attempt and its retry share (the 2-second floor above can stretch it slightly). A timeout or abort skips the repair retry and escalates at once.
3. **Tier 3 (Calm Degradation)**: If cloud models are unreachable or rate-limited, the system drops back to deterministic archetype templates. The same happens when no API key is set or the daily model-call cap is reached. The Style DNA card calmly notes: _"Showing standard style profile for now; your custom vibe will be infused when you retry."_
4. Every invocation produces a structured `AgentRunRecord` (`activeTier`, `durationMs`, `modelId`, `fallbackReason`, `timestamp`; `src/lib/ai/schemas.ts`), which the ladder logs as `agent_run_record`. The fallback reason is a stable code such as `tier_1_failed:model_timeout`, never raw error text. Token consumption is not recorded.

## Consequences

- Guarantees 100% demo uptime and continuous user progress.
- Enforces strict separation between LLM suggestions and deterministic plan scaffolding.
