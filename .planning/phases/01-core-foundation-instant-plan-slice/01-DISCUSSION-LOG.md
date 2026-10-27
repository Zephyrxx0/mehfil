# Phase 1: Core Foundation & Instant Plan Slice - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-27
**Phase:** 1-Core Foundation & Instant Plan Slice
**Areas discussed:** Intake Flow Experience, Archetype Presets & Cultural Defaults, Budget Scaling Dynamics, Timeline Checkpoints & ICS Export

---

## Intake Flow Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Stepped micro-wizard | 3 focused steps: Event Basics -> Scale & Budget -> Cultural Nuances/Constraints for a calm mobile-friendly flow | ✓ |
| Single-page modal | All fields visible at a glance | |
| Conversational card stack | One card per question with auto-advance | |
| You decide | Agent picks cleanest approach | |

**User's choice:** Stepped micro-wizard (3 focused steps: Event Basics -> Scale & Budget -> Cultural Nuances/Constraints)

| Option | Description | Selected |
|--------|-------------|----------|
| 1-click starter chips | Preset chips at top of modal ("Big Fat Delhi Wedding ₹25L", "Intimate 50th Birthday ₹5L", "Society Diwali Gala ₹8L") | ✓ |
| Clean blank inputs only | Organizer enters real event data without preset distractions | |
| Inline "Try sample data" button | Populates active step with defaults | |
| You decide | | |

**User's choice:** 1-click starter chips at top of modal for instant demo/testing

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select chip tags + note | Chip tags ([Pure Veg/Jain], [Elderly Accessibility], [Late Night Sound], [Ritual Slots]) + optional custom note with "Skip & Generate" action | ✓ |
| Freeform notes textarea only | Open-ended text field | |
| Strict structured dropdowns | Dropdowns per category | |
| You decide | | |

**User's choice:** Multi-select chip tags + optional custom note with explicit "Skip & Generate" action

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle 300ms celebration reveal | Subtle "Balancing budget & timeline..." confirmation pulse before transitioning into populated workspace | ✓ |
| Instant zero-delay cut | <10ms hard switch directly to workspace without animation | |
| Smooth modal slide-down | Reveal workspace underneath | |
| You decide | | |

**User's choice:** Gentle 300ms celebration reveal with confirmation pulse before transitioning into populated workspace

---

## Archetype Presets & Cultural Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| 3 primary milestone archetypes | Indian Wedding (Multi-day), Milestone Birthday (50th Golden/Silver), Community Cultural Meet (Diwali/Society Utsav) | ✓ |
| Wedding-only depth | 100% focus on wedding variants | |
| Broad multi-event spectrum | Wedding, Birthday, Anniversary, Housewarming, Community Gala | |
| You decide | | |

**User's choice:** 3 primary milestone archetypes (Indian Wedding, Milestone Birthday, Community Cultural Meet)

| Option | Description | Selected |
|--------|-------------|----------|
| 7 standard categories + 5% contingency | Venue & Stage, Catering & Drinks, Decor & Flowers, Photo & Film, Entertainment & Sound, Favors & Invites, Miscellaneous + 5% Contingency Buffer | ✓ |
| Simplified 4 buckets | Venue & Production, Food & Hospitality, Media & Styling, Guest Experience | |
| Granular 12+ sub-categories | Extended breakdowns | |
| You decide | | |

**User's choice:** 7 standard categories + explicit 5% Contingency Buffer line

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-set to archetype signature | Pre-assigned signature (Wedding -> Catering, Birthday -> Entertainment, Community -> Grand Feast) with 1-click star/lock icon on every line | ✓ |
| Unassigned by default | Banner prompting organizer to choose | |
| Mandatory selection in Step 2 | Forced selection during intake wizard | |
| You decide | | |

**User's choice:** Pre-set to archetype signature with 1-click star/lock icon on every line to reassign

| Option | Description | Selected |
|--------|-------------|----------|
| Authentic Indian numbering system | ₹25,00,000 with Indian comma grouping and Lakh/Crore compact badges (₹25L), accepting plain numbers and Lakh shorthand | ✓ |
| Standard international notation | ₹2,500,000 / ₹2.5M | |
| Plain unformatted numbers | ₹ 2500000 | |
| You decide | | |

**User's choice:** Authentic Indian numbering system (₹25,00,000 and ₹25L)

---

## Budget Scaling Dynamics

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed Total Budget invariant | Guest increases scale per-guest lines by trimming elastic lines, keeping Protected Moment untouched. Triggers Shortfall remedies at floor | ✓ |
| Dynamic Total Budget | Guest increases expand total event budget | |
| Organizer toggle | Switch between Lock Total Budget vs Scale Total Budget | |
| You decide | | |

**User's choice:** Fixed Total Budget invariant: guest increases scale per-guest lines from elastic lines, keeping Protected Moment untouched and triggering Shortfall remedies if floors are breached

| Option | Description | Selected |
|--------|-------------|----------|
| Whole Rupees in primary UI | Largest-remainder apportionment at rupee boundary, integer paise internal precision | ✓ |
| Exact Rupees and Paise | Display paise in primary UI (₹1,25,450.75) | |
| Rounded thousands | ₹1.25L with expandable breakdown | |
| You decide | | |

**User's choice:** Display whole Rupees (₹) in primary UI via largest-remainder at rupee boundary, maintaining internal paise precision

| Option | Description | Selected |
|--------|-------------|----------|
| Archetype minimum floor ratio | Elastic lines cannot squeeze below 40% of baseline; reaching 40% triggers Permissive Shortfall remedies (ADR-0002) | ✓ |
| Fixed absolute rupee floor | Minimum ₹30,000 for Decor, etc. | |
| Zero floor limit | Categories can squeeze to ₹0 | |
| You decide | | |

**User's choice:** Archetype minimum floor ratio (40% floor triggering Permissive Shortfall remedies per ADR-0002)

| Option | Description | Selected |
|--------|-------------|----------|
| Both banner + inline change pills | Top summary banner with explanation & undo + inline (+/-) change pills on affected cards | ✓ |
| Top plain-language banner only | Banner only with undo | |
| Inline badges only | Card badges without global banner | |
| You decide | | |

**User's choice:** Both top plain-language summary banner (with undo) and inline (+/-) change pills on affected cards

---

## Timeline Checkpoints & ICS Export

| Option | Description | Selected |
|--------|-------------|----------|
| Phased milestone bands | T-6M: Venue & Date Lock, T-3M: Catering & Vendors, T-1M: Invites & Fittings, T-2W: Final Numbers, Day-Of: Execution with task cards underneath | ✓ |
| Flat chronological list | Date-ordered list with relative badges | |
| Dual-view toggle | Toggle between List and Bands | |
| You decide | | |

**User's choice:** Phased milestone bands with task cards underneath each band

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate Action sprint | Bundle past milestones into high-priority "Immediate Action (This Week)" triage group per ADR-0005 | ✓ |
| Proportional lead-time compression | Compress durations into remaining days | |
| Red warning badges | Scattered overdue alerts | |
| You decide | | |

**User's choice:** Immediate Action sprint (ADR-0005 baseline) for close event dates

| Option | Description | Selected |
|--------|-------------|----------|
| All-day milestone calendar events | All-day events with automatic 9:00 AM reminder alert and description listing tasks/guidelines | ✓ |
| Timed calendar blocks | Specific hour deadlines with multi-stage alarms | |
| Export dialog toggle | Milestones only vs Full detailed schedule | |
| You decide | | |

**User's choice:** All-day milestone calendar events with automatic 9:00 AM reminder alert and task guidelines

| Option | Description | Selected |
|--------|-------------|----------|
| Clickable budget category pill | Pill on task card ([Catering • ₹7,50,000]) smoothly scrolling/highlighting corresponding budget line | ✓ |
| Rich task modal | Detailed modal with allocation breakdown | |
| Text-only category tag | Non-interactive tag | |
| You decide | | |

**User's choice:** Clickable budget category pill on task card linking directly to corresponding budget line

---

## the agent's Discretion

- Styling specifics for stepper pills and smooth Framer Motion layout transitions.
- Concrete lead-time day offsets for milestones in each archetype.
- Code organization for TypeScript calculation engine modules.

## Deferred Ideas

- None — discussion stayed within Phase 1 scope.

