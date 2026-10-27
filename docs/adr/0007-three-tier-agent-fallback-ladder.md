# 7. Three-Tier Agent Fallback Ladder for Zero-Failure Operations

All agent-invoked workflows operate behind a strict three-tier fallback ladder: primary model self-repair retry, secondary cloud escalation (Gemini Flash), and deterministic archetype degradation.

## Context
In live event planning sessions and judging demos, model rate limits, API latency spikes, or subtle JSON schema validation errors can catastrophically halt user onboarding. A traditional error modal or infinite loading spinner ruins user trust and violates the core tenet of "Calm and festive, not busy."

## Decision
1. **Tier 1 (Self-Repair)**: Upon initial schema validation failure, the orchestrator triggers a single immediate retry feeding the Zod validation error back to the primary model (Gemma 4) with zero temperature.
2. **Tier 2 (Cloud Escalation)**: If Tier 1 fails or times out (exceeding 8 seconds), the request is escalated immediately to Gemini Flash.
3. **Tier 3 (Calm Degradation)**: If cloud models are unreachable or rate-limited, the system drops back to deterministic archetype templates. The UI calmly notes: *"Showing a standard plan for now; your style preferences will be applied when you retry."*
4. Every invocation logs a structured `Run Record` recording latency, token consumption, and the active tier.

## Consequences
- Guarantees 100% demo uptime and continuous user progress.
- Enforces strict separation between LLM suggestions and deterministic plan scaffolding.

