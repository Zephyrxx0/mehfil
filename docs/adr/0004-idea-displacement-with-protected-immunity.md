# 4. Idea Adoption via Budget-Neutral Displacement

Personalized ideas proposed by the Idea Curator actively mutate the Linked Plan through deterministic budget-neutral displacement of elastic lines, while guaranteeing complete immunity for the Protected Moment.

## Context
Event organizers often add exciting ideas without realizing the downstream trade-offs, leading to budget inflation. In standard apps, ideas remain disconnected Pinterest-style moodboards. Mehfil's core thesis is that personalization must move the plan's numbers.

## Decision
1. When an Idea is toggled on, the engine checks whether its cost fits within available flexible line headroom without violating minimum floors.
2. The necessary funding is displaced from elastic lines in reverse order of elasticity.
3. The budget allocation for the user's **Protected Moment** is strictly immune to displacement.
4. Each idea adoption generates an explicit change record with associated timeline tasks and one-click undo capability.

## Consequences
- Prevents budget creep while fostering intentional trade-offs.
- Requires real-time visual feedback showing exactly which lines donate funds to support the idea.

