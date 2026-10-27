# Phase 2: Festive Design System & Centerpiece Kinetic Hero - Context

**Gathered:** 2026-10-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the festive visual identity, Mehfil token system, shadcn primitives styling, and the centerpiece landing experience:
- Strict 3-hue festive palette tokens (`globals.css`, Tailwind theme, meeting WCAG AAA 4.5:1+ contrast on all fills: Warm Ivory `#FFF8EE`, Marigold `#F7C873`, Gulabi Rose `#F2A7B8`, and Royal Plum ink `#3A2442`).
- Centerpiece landing page hero with big, bold Fraunces display typography, Tiro Devanagari Hindi wordmark ("महफ़िल"), vertical fluid slot-machine sentiment cycling (Wedding, Milestone, Soirée, Mehfil), staggered word springs, and an ethereal jali watermark with subtle desktop mouse parallax.
- Lightweight HTML5 Canvas ambient particle system with drifting Marigold and Rose petal silhouettes at 60fps, paired with strict `prefers-reduced-motion` automatic pause and opacity fallbacks.
- shadcn/ui primitives integration (Button, Card, Badge, Dialog, Sheet, Slider) configured with `--radius: 1.25rem` (20px/24px) curves, hairline plum borders (`border-royal-plum/10`), and complete refactoring of Phase 1 components to shadcn primitives.
- Next.js font optimization via `next/font/google` for `Fraunces`, `Plus Jakarta Sans`, and `Tiro Devanagari Hindi`.
- Responsive workspace shell with a 3-pane desktop view (35% Budget, 40% Timeline, 25% Explainer/Summary) and a 4-tab mobile navigation bar (`[Budget, Timeline, Style, Summary]`) with a persistent bottom drawer sheet.
- Vitest automated token contrast and anti-pattern test suite enforcing "no white text on pastels".

</domain>

<decisions>
## Implementation Decisions

### Kinetic Hero Animation & Sentiment Cycling
- **D-01:** Centerpiece headline sentiment cycling uses a vertical fluid slot-machine roll with Motion (`motion/react`): words enter from the bottom and settle with a celebratory spring bounce (`y: [24, 0, -24]`, blur + opacity) cycling every 3.5s across celebration archetypes (Wedding, Milestone, Soirée, Mehfil). — **Reversibility:** reversible
- **D-02:** On initial page load, headline and hero elements assemble via a staggered word-by-word spring reveal (Fraunces words spring up with stiffness: 120, damping: 18 and a 40ms stagger), followed by the reassuring subtitle, the primary CTA pill, and starter chips. — **Reversibility:** reversible
- **D-03:** The primary CTA ("Start Your Mehfil") is a tactile pill (`h-14`, `px-8`, `rounded-full`, Marigold background with Plum text, `scale: 0.96` active press, animated micro-sheen on hover) that opens the 3-step `BriefModal` instantly on click without full-page reloads. — **Reversibility:** reversible
- **D-04:** Devanagari script is prominently integrated via a header wordmark ("महफ़िल" in `Tiro Devanagari Hindi` with English subtitle "Mehfil") and an ethereal geometric Devanagari / mandala watermark aura (`opacity: 0.06`) centered behind the main Fraunces headline. — **Reversibility:** reversible

### Celebration Micro-motion & Ambient Layer
- **D-05:** Ambient celebration particles (25–35 floating Marigold `#F7C873` and Gulabi Rose `#F2A7B8` petal silhouettes) are rendered using a lightweight HTML5 Canvas layer (`requestAnimationFrame`), guaranteeing 60fps performance, zero DOM node bloat, and zero cursor latency. — **Reversibility:** reversible
- **D-06:** The geometric jali / mandala watermark continuously rotates with an ultra-slow 120s cycle, accompanied by smooth dampened desktop mouse parallax tilt (max ±6px offset), remaining static on mobile/touch devices. — **Reversibility:** reversible
- **D-07:** Strict accessibility enforcement via `useReducedMotion`: when `prefers-reduced-motion` is active, the Canvas particle loop completely halts, mandala rotation freezes statically, and word cycling defaults to pure 200ms opacity cross-fades per DESIGN.md §7.3. — **Reversibility:** reversible
- **D-08:** Adopt `motion` (Motion v11/12 via `motion/react`) for UI spring physics, `AnimatePresence`, layout transitions, and tactile button compression, paired with native HTML5 Canvas for the ambient particle layer. — **Reversibility:** costly — core animation library dependency across UI components

### shadcn Component Styling & 3-Hue Token Integration
- **D-09:** Scaffold and theme the core six shadcn/ui primitives (`button`, `card`, `badge`, `dialog`, `sheet`, `slider`) using `shadcn` CLI, styled with Mehfil's 3-hue tokens, `1.25rem` radius, and hairline plum borders. — **Reversibility:** costly — foundation for all UI primitives
- **D-10:** Fully refactor Phase 1 components to the styled shadcn primitives (upgrade `BriefModal` to shadcn Dialog, `BudgetLineCard` to shadcn Card, status pills to shadcn Badge/Button), establishing unified visual consistency across the entire codebase. — **Reversibility:** costly — touches all Phase 1 UI components
- **D-11:** Load Google Fonts (`Fraunces`, `Plus Jakarta Sans`, `Tiro Devanagari Hindi`) via `next/font/google` in `src/app/layout.tsx` defining CSS variables (`--font-fraunces`, `--font-jakarta`, `--font-tiro`) mapped to Tailwind font families with zero layout shift. — **Reversibility:** reversible
- **D-12:** Build an automated Vitest token contrast and anti-pattern test suite that mathematically validates color contrast ratios (all exceeding WCAG AAA 4.5:1/7:1) and asserts that white text (`text-white` / `#FFFFFF`) is strictly forbidden on pastel backgrounds (Marigold and Rose). — **Reversibility:** reversible

### Workspace Shell & Responsive Layout
- **D-13:** Desktop workspace adopts a 3-pane responsive layout (35% Interactive Budget & Sliders, 40% Backwards Milestone Timeline, 25% Sticky Change Explainer & History) with generous spacing and independent column scrolling. — **Reversibility:** reversible
- **D-14:** Mobile workspace implements a 4-tab bottom navigation bar (`[Budget, Timeline, Style, Summary]`) paired with a persistent swipeable bottom sheet drawer handle displaying live rebalancing change logs and undo controls. — **Reversibility:** reversible
- **D-15:** Live Change Explainer renders versioned plain-language cards explaining exact integer paise redistributions and floor protections, paired with a prominent One-Click Undo action that restores previous snapshots. — **Reversibility:** reversible
- **D-16:** Transition from the Landing Hero into the Plan Workspace executes as a smooth layout crossfade with celebratory number counter animation (`tabular-nums`) and staggered milestone card entrance. — **Reversibility:** reversible

### the agent's Discretion
- Particle geometry drawing routines on the HTML5 Canvas (petal curve cubic bezier coordinates).
- Specific responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`) for collapsing the 3-pane desktop layout into tablet and mobile drawer modes.
- Micro-timing parameters for the One-Click Undo card dismiss transition.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & Token Specifications
- `DESIGN.md` — Authoritative design system contract: 3-hue palette calibration, Fraunces/Tiro Devanagari Hindi typography, spatial radii, and 5 signature micro-interactions.
- `DESIGN.md` §2.4 — `globals.css` CSS variable token mapping and HSL values.
- `DESIGN.md` §7.1 — Spring physics parameters (snappy, gentle elevation, celebratory settle).
- `DESIGN.md` §8 — Anti-patterns and banned AI clichés (strict ban on white text on pastels, neon glows, pure black).

### Product Requirements & ADRs
- `PRD.md` §3.1 — Event intake brief and deterministic archetype generation.
- `PRD.md` §4.1 — Plain-language re-balancing feedback and one-click undo.
- `docs/adr/0001-deterministic-baseline-first.md` — Zero-blank-screen deterministic baseline and instant generation.
- `docs/adr/0008-closed-component-registry-with-entity-binding.md` — Component registry standards for UI blocks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/engine/budget.ts` & `src/lib/engine/timeline.ts`: Pure TypeScript calculation engines operating on integer paise and backwards topological dates.
- `src/lib/engine/currency.ts`: Indian numbering format utility (`formatINR`) with lakh/crore formatting.
- `src/components/intake/BriefModal.tsx`: 3-step micro-wizard for event brief intake (to be upgraded to shadcn Dialog).
- `src/components/workspace/PlanWorkspace.tsx`: Phase 1 baseline workspace wiring budget lines and timeline milestones (to be upgraded to 3-pane shell).
- `src/app/globals.css`: Base CSS variables already partially initialized with Warm Ivory, Marigold, Gulabi Rose, and Royal Plum.

### Established Patterns
- Pure functional engine separation: calculation logic strictly lives in `src/lib/engine/` and UI strictly consumes immutable snapshots.
- Integer paise monetary amounts with largest-remainder apportionment at rupee display boundaries.
- No client-side logins or complex auth overhead (ready for Phase 3 anonymous sessions).

### Integration Points
- `src/app/layout.tsx`: Root layout hosting `next/font/google` font variables, metadata, and global body background.
- `src/app/page.tsx`: Landing page hosting the centerpiece animated hero, Devanagari brand watermark, Canvas particle layer, and transition to `PlanWorkspace`.
- `src/components/ui/`: New directory hosting shadcn primitives (`button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `sheet.tsx`, `slider.tsx`).
- `src/components/hero/`: New components for the kinetic centerpiece (`HeroHeadline.tsx`, `CelebrationParticles.tsx`, `JaliWatermark.tsx`).
- `src/components/workspace/WorkspaceShell.tsx`: Responsive 3-pane desktop container and 4-tab mobile drawer navigation.

</code_context>

<specifics>
## Specific Ideas

- Slot-machine vertical sentiment cycle: "Where your [Wedding | Milestone | Soirée | Mehfil] moves in harmony" cycling every 3.5s with spring blur & bounce.
- Canvas celebration petals: Soft petal silhouettes in Marigold (`#F7C873`) and Gulabi Rose (`#F2A7B8`) floating with gentle sinusoidal drift and zero lag.
- Ethereal watermark: Subtle Indian geometric jali / rangoli vector mandala at 0.06 opacity with 120s continuous slow rotation and ±6px dampened mouse tilt on desktop.
- Single minimalist CTA: "Start Your Mehfil" button with tactile pill press and micro-sheen on hover.
- Strict WCAG AAA validation: Plum text on Ivory (11.8:1), Marigold (7.4:1), and Rose (6.8:1), with Vitest automated tests banning white text on pastels.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 2 scope.

</deferred>

---

*Phase: 2-Festive Design System & Centerpiece Kinetic Hero*
*Context gathered: 2026-10-27*

