# 1. Deterministic Baseline First for Plan Lifecycle

When an organizer creates an event, the system immediately instantiates and renders a complete, mathematically balanced v1 Linked Plan from deterministic template archetypes, before initiating asynchronous vision and planner model pipelines.

## Context

Milestone event planning requires user trust in numbers. Model latency, rate limits, or vision extraction failures during live onboarding create catastrophic bounce risk and blank-screen anxiety. Traditional AI planners block on slow, brittle multi-agent pipelines before showing any UI.

## Decision

1. The engine constructs a fully realized v1 Plan synchronously using template weights, static timeline lead-times, and budget arithmetic.
2. In the background, the Style Analyst extracts Style DNA from images and the Planner calculates bounded multiplier adjustments.
3. Once completed, the AI adjustments are applied as an audited v2 version mutation, allowing the organizer to see exactly what changed and why, or revert to baseline.

## Consequences

- Zero blank loading screens; instant first-contentful paint.
- Total resilience against AI failure: if model APIs timeout or fail schema validation, the user retains a practical, usable event plan.
- Plan mutations follow an append-only version history (`v1 Baseline` -> `v2 Styled`).
