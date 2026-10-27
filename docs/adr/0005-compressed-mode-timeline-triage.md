# 5. Compressed Mode for Short-Notice Timeline Triage

When an event date is scheduled on short notice such that standard template lead times fall in the past, the Timeline Engine enters Compressed Mode, sorting immediate actions by topological dependency criticality rather than chronological delinquency.

## Context
Standard wedding and event templates assume 6 to 12 months of planning time. Organizers booking milestone events on 4 to 8 weeks' notice are confronted with dozens of demoralizing "Overdue" notifications if treated naively. Linearly compressing dates fails because real-world vendor booking dependencies cannot be compressed arbitrarily (e.g., caterer tasting cannot happen before venue contract).

## Decision
1. Overdue tasks are identified but secondary non-blocking milestones are collapsed.
2. The schedule surfaces an "Immediate Triage" queue focusing strictly on the Critical Path—tasks with the highest count of unblocked downstream dependencies (e.g., Venue, followed by Catering).
3. The interface displays calm, actionable guidance on what must be secured this week, avoiding panic-inducing red alert banners.

## Consequences
- Preserves the calm, reassuring ethos of the product.
- Requires topological sorting logic in the pure TypeScript timeline engine.
- Clearly delineates which tasks are critical blockers versus optional enhancements.

