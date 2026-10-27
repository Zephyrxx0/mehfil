# Phase 4: Multi-Agent Style DNA & Resilient Fallback Ladder - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-27
**Phase:** 4-Multi-Agent Style DNA & Resilient Fallback Ladder
**Areas discussed:** Vibe Intake UX & Swatch Gallery, Style DNA Calibration & Planner Multipliers, v2 Plan Reveal & Transition Choreography, Fallback Ladder UI & Calm Degradation

---

## Vibe Intake UX & Swatch Gallery

| Option | Description | Selected |
|--------|-------------|----------|
| Sequential step in intake wizard | Brief form -> Vibe Gallery (swatches + moment + trade-offs) -> Instant v1 + v2 reveal. Keeps onboarding cohesive. | ✓ |
| Post-baseline workspace trigger | Brief immediately generates v1 plan, with an ambient "Infuse Style DNA" callout inside workspace. | |
| Standalone modal | Can be accessed anytime from workspace header "Style DNA" button to refine or re-run style extraction. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid local WebP assets in /public/swatches/ | Festive tags, palettes, and SVG placeholder fallbacks. Fast, offline-safe, and zero external latency. | ✓ |
| Unsplash CDN photography URLs | Curated for weddings, birthdays, and community festivals. Rich imagery but depends on external network. | |
| Pure programmatic SVG/CSS artistic mood tiles | Geometric jali patterns, botanical motifs, and rich palette swatches. Zero image files. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Strict 6–8 counter | Celebratory counter pill ('Pick 6 to 8 vibes (X/8 selected)') and quick preset filters (e.g. 'Royal Heritage', 'Garden Pastel', 'Minimalist Festive'). | ✓ |
| Flexible minimum | 'Pick 3 to 8 vibes' to reduce friction for organizers who just want a fast quickstart. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two-step micro-wizard | Step 3A (Pick Swatches) -> Step 3B (Protected Moment input & 3 Forced-Choice Trade-offs: Feast/Spectacle, Intimate/Grand, Heritage/Modern). | ✓ |
| Single unified view | 24 swatches at top, Protected Moment sentence box and 3 trade-off pills pinned in a sticky drawer/sidebar. | |

**User's choice:** Sequential intake flow with hybrid local WebP assets in `/public/swatches/`, strict 6-8 counter with celebratory pill and preset filters, split into Step 3A (Swatches) and Step 3B (Moment & Trade-offs).

---

## Style DNA Calibration & Planner Multipliers

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive 8-axis profile | Formality, Energy, Scale, Heritage vs Modern, Feast vs Spectacle, Music, Decor Density, Indoor vs Outdoor + Named Palette (3-4 hues) and 1-sentence vibe statement (PRD §3.2). | ✓ |
| Streamlined 5-axis profile | Formality, Energy, Tradition, Decor Density, Food vs Spectacle + Named Palette. Faster to review. | |

| Option | Description | Selected |
|--------|-------------|----------|
| ±25% bound ([0.75x, 1.25x]) | Gives meaningful, noticeable festive leaning while preserving structural budget safety. | ✓ |
| ±20% bound ([0.80x, 1.20x]) | More conservative; guarantees tighter adherence to baseline archetype weights. | |
| ±35% bound ([0.65x, 1.35x]) | Bolder differentiation for distinctive aesthetics. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Style Analyst auto-mapping + 1.25x floor | Maps sentence to closest budget line category + locks a 1.25x floor multiplier, tagging the line with exact user quote and rose badge. | ✓ |
| User explicit category dropdown | User picks category from dropdown ('Which category powers this moment?') alongside their sentence. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive Style DNA Card in Pane 3 / Drawer | Top of Pane 3 (Desktop) and Drawer (Mobile) with dimension pills, named palette swatches, and 'Edit Style DNA' button opening slider sheet. | ✓ |
| Read-only header badge | Header badge with modal popover to view and re-tune dimensions. | |

**User's choice:** Comprehensive 8-axis profile matching PRD §3.2, ±25% multiplier bounds on archetype baseline, auto-mapping Protected Moment to closest category line with 1.25x floor multiplier and rose badge, and interactive Style DNA card at top of Pane 3 / Drawer with slider retune sheet.

---

## v2 Plan Reveal & Transition Choreography

| Option | Description | Selected |
|--------|-------------|----------|
| Two-beat reveal | Instant workspace arrival showing baseline v1 (<10ms), followed by a 1.2s smooth GSAP/Motion re-balance bar animation as Style DNA finishes, highlighting what shifted. | ✓ |
| Cinematic 2.0s interstitial | Displays swatches fusing into Style DNA card, then cross-fades into v2 workspace. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Highlighted v2 Change Banner + ChangeExplainer | Banner + auto-updated ChangeExplainer in Pane 3 with plain-language rationale: 'Infused [Vibe Name]: Elevated Decor (+₹X) and Entertainment (+₹Y); Protected Moment held firm at floor.' | ✓ |
| Subtle top toast notification | 'Style DNA applied (+₹X Decor, +₹Y Music)' to keep view clean. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated 'Reset to Baseline (v1)' action | Button inside Style DNA card menu, plus standard 1-click forward restore in Version History. | ✓ |
| Version History only | Rely solely on existing Version History restore button in ChangeExplainer pane. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Full accessible motion | Spring physics on budget bars and counter numbers, with automatic zero-delay instant snaps when prefers-reduced-motion is active. | ✓ |
| CSS transitions only | Standard 300ms ease-out transitions for numbers and widths without bouncy spring physics. | |

**User's choice:** Two-beat reveal (instant v1 arrival, followed by 1.2s smooth GSAP/Motion re-balance bar spring animation), highlighted v2 change banner with plain-language rationale, dedicated 'Reset to Baseline' button in Style DNA card, and full spring physics honoring reduced-motion.

---

## Fallback Ladder UI & Calm Degradation

| Option | Description | Selected |
|--------|-------------|----------|
| 8-second timeout for Tier 1 | 1 schema-repair retry, escalating to Gemini 2.0 Flash (Tier 2) before dropping to deterministic Tier 3. | ✓ |
| 5-second fast timeout | Faster escalation to Gemini Flash to maintain aggressive sub-second feel on mobile networks. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Calm note on Style DNA card | 'Showing standard style profile for now; your custom vibe will be infused when you retry' with subtle 'Retry Extraction' button. Zero alarming dialogs. | ✓ |
| Top-bar status pill | 'Style Profile Estimated (Offline)' badge next to sync indicator. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Attached to plan_version metadata | `meta.run_record`: active_tier, duration_ms, model_id, fallback_reason + structured JSON console logging. Transparent, zero extra table. | ✓ |
| Dedicated Postgres table | `agent_run_records` for full audit trails and analytics. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Seamless local mock/heuristic | If no API key is present, seamlessly execute Tier 3 deterministic extractor with friendly dev console log. 100% testable out-of-the-box. | ✓ |
| Strict check | Throw an explicit warning in development if GOOGLE_GENERATIVE_AI_API_KEY is missing. | |

**User's choice:** 8-second Tier 1 timeout with schema-repair retry -> Gemini 2.0 Flash -> deterministic Tier 3 fallback; calm note on Style DNA card with retry button; Run Records attached to `plan_version.meta.run_record` + console logs; seamless local heuristic execution when API keys are unconfigured.

---

## the agent's Discretion

- Exact swatch filenames, titles, tags, and palette hex definitions in `/public/swatches/swatches.json`.
- Specific prompt wording for Style Analyst and Planner within Vercel AI SDK structured generation pipelines.
- Micro-interactions on swatch card selection (subtle gold ring, checkmark badge, and spring pop).
- Heuristic fallback scoring algorithm mapping swatch tags and trade-offs directly to the 8-dimension profile.

## Deferred Ideas

(None raised during this discussion — all decisions remained strictly within Phase 4 scope)
