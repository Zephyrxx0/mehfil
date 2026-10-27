# 2. Permissive Shortfall State with Deterministic Remedies

The budget engine permits plans to transition into an Infeasible State when real-world vendor quotes or user allocations exceed the total budget, presenting deterministic mathematical remedies rather than blocking user input.

## Context
When planning milestone celebrations, real-world quotes frequently exceed preliminary estimates. Hard-clamping UI sliders or rejecting over-budget quotes prevents organizers from modeling reality. Conversely, silently trimming protected lines or relying on AI hallucinations to fudge numbers destroys user trust.

## Decision
1. When committed amounts plus non-negotiable floors exceed total budget, the engine marks the plan as an Infeasible State.
2. The UI surfaces an immediate shortfall banner displaying the deficit in local currency (`₹`).
3. The engine computes exactly three deterministic remedies without model calls:
   - Increase total budget by the exact shortfall amount.
   - Reduce guest count to the threshold that restores per-guest feasibility.
   - Defer or prune the most elastic optional budget lines.

## Consequences
- Organizers are never blocked by rigid UI barriers while evaluating vendor quotes.
- The arithmetic remains 100% transparent and deterministic.
- Downstream systems (exports, summaries) must handle and display the infeasibility warning gracefully.

