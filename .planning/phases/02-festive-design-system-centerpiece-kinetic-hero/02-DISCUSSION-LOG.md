# Phase 2: Festive Design System & Centerpiece Kinetic Hero - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-27
**Phase:** 2-Festive Design System & Centerpiece Kinetic Hero
**Areas discussed:** Kinetic Hero Animation & Sentiment Cycling, Celebration Micro-motion & Ambient Layer, shadcn Component Styling & 3-Hue Token Integration, Workspace Shell & Responsive Layout

---

## Kinetic Hero Animation & Sentiment Cycling

### Headline Sentiment Cycling

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical fluid slot-machine roll with Motion | Words enter from bottom, settle with celebratory spring bounce (y: [24, 0, -24], blur + opacity), cycling every 3.5s across Wedding, Milestone, Soirée, Mehfil | ✓ |
| Devanagari-English paired flip | Shows bilingual pairings transitioning together (e.g., 'विवाह • Wedding', 'उत्सव • Milestone', 'महफ़िल • Mehfil') reinforcing cultural identity | |
| Subtle inline typographic morph | Words dissolve and re-space horizontally with letter-spacing tracking animation | |
| You decide | Use standard Motion.js spring physics with 3.5s interval and gentle spring settle | |

**User's choice:** Vertical fluid slot-machine roll with Motion.
**Notes:** Provides a lively, joyous cadence to the centerpiece headline while maintaining Fraunces typographic elegance.

### Assembly on Initial Page Load

| Option | Description | Selected |
|--------|-------------|----------|
| Staggered word-by-word spring reveal | Each Fraunces word springs up (stiffness 120, damping 18) with a 40ms stagger, followed by the reassuring subtitle, then primary CTA pill and starter chips | ✓ |
| Line-by-line soft wave elevation | Two synchronized wave reveals ('Celebrations,' then 'Orchestrated in Harmony') for a slightly calmer editorial feel | |
| Immediate display with subtle micro-fade | Minimal motion overhead, instant load for low-power devices, with only the cycling word animated | |
| You decide | Implement DESIGN.md §7.1 celebratory settle parameters | |

**User's choice:** Staggered word-by-word spring reveal.
**Notes:** Matches the signature Hero Entrance micro-interaction specified in DESIGN.md §7.2.

### Primary CTA Interaction & Transition

| Option | Description | Selected |
|--------|-------------|----------|
| Tactile pill press with micro-sheen -> opens BriefModal | Sized h-14, px-8, Marigold fill with Plum text, gentle sheen sweep on hover, scale 0.96 press, opening 3-step BriefModal instantly | ✓ |
| Hero morph expand transition | Clicking CTA smoothly morphs hero container into intake wizard in-place with shared layout spring | |
| Scroll-down reveal | Smooth scroll down to embedded full-width intake canvas on same page | |
| You decide | Standard tactile pill opening BriefModal per DESIGN.md §4.3 | |

**User's choice:** Tactile pill press with micro-sheen -> opens BriefModal.
**Notes:** Guarantees zero cognitive friction and instantaneous progression into the planning engine.

### Devanagari Script Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Prominent Devanagari wordmark in header with ethereal background watermark | 'महफ़िल' in Tiro Devanagari Hindi in top bar with English subtitle, plus a delicate, faint Devanagari/mandala watermark (opacity 0.06) behind main Fraunces headline | ✓ |
| Dual-script hero badge | Top badge above headline reading 'महफ़िल • A Gathering of Hearts' with main headline in Fraunces serif | |
| Pure English headline with Devanagari reserved strictly for brand logo/navbar | Keep hero copy 100% in English Fraunces for maximum immediate legibility | |
| You decide | Balanced cultural presence per DESIGN.md §4.1 | |

**User's choice:** Prominent Devanagari wordmark in header with ethereal background watermark.
**Notes:** Authentic cultural resonance without cluttering the editorial English typography.

---

## Celebration Micro-motion & Ambient Layer

### Ambient Particles Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight HTML5 Canvas layer | 25-35 soft floating Marigold & Rose petal silhouettes drifting gently at 60fps, zero DOM node overhead, with zero cursor latency | ✓ |
| CSS keyframe floating elements | 12-15 SVG petal nodes positioned with CSS translate and gentle rotation loops | |
| Framer Motion / Motion.js spring particle nodes | React components animated via Motion physics | |
| You decide | Canvas implementation ensuring zero layout thrashing and high mobile frame rates | |

**User's choice:** Lightweight HTML5 Canvas layer.
**Notes:** Ensures pristine 60fps rendering without DOM reflows or cursor lag on mobile and lower-powered devices.

### Geometric Jali / Mandala Watermark

| Option | Description | Selected |
|--------|-------------|----------|
| Continuous ultra-slow rotation with subtle desktop mouse parallax | Ethereal SVG jali/mandala (opacity 0.06) rotating over 120s with smooth dampened mouse tilt (±6px) on desktop, static on mobile | ✓ |
| Static geometric watermark | Non-interactive fixed SVG centered behind hero type with 0.06 opacity for zero CPU work | |
| Scroll-linked rotation | Mandala rotates as user scrolls down into features/archetypes | |
| You decide | Follow DESIGN.md §7.2 with slow rotation and dampened mouse parallax | |

**User's choice:** Continuous ultra-slow rotation with subtle desktop mouse parallax.
**Notes:** Adds tactile depth and bespoke luxury feel without distracting from typography.

### Reduced Motion Accessibility

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic system hook (useReducedMotion) | Immediately stops Canvas particle loop, freezes mandala rotation to static, and switches word swaps to 200ms opacity cross-fades per DESIGN.md §7.3 | ✓ |
| System query + In-app quick toggle | Automatic prefers-reduced-motion detection plus discreet accessibility toggle button | |
| Static particle freeze | Keep 10 static subtle petal accents on screen but completely pause all animations | |
| You decide | Strict system query enforcement halting loop per specification | |

**User's choice:** Automatic system hook (useReducedMotion).
**Notes:** Strict WCAG AAA compliance and battery/performance consideration.

### Motion Package Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Install 'motion' (Motion v11/12 via motion/react) | Modern official package with spring physics, AnimatePresence, layout animations, and lightweight bundle footprint | ✓ |
| Pure GSAP (gsap + @gsap/react) | Unified GSAP timelines for landing entrance and all micro-motion | |
| Hybrid (Motion for UI micro-interactions + GSAP for choreographed hero entrance) | Follow STACK.md supporting stack exactly | |
| You decide | 'motion' for React components and Canvas for celebration particles | |

**User's choice:** Install 'motion' (Motion v11/12 via motion/react).
**Notes:** Modern, type-safe React 19 compatible spring physics engine.

---

## shadcn Component Styling & 3-Hue Token Integration

### shadcn Primitives Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Core six primitives (button, card, badge, dialog, sheet, slider) | Covers hero, intake modal, budget sliders, and mobile change drawer with Mehfil tokens | ✓ |
| Full suite (core six + tabs, tooltip, separator, dropdown-menu) | Broad foundation for upcoming phases (vibe grid, quote check) | |
| Minimal set (button, badge, dialog) | Only what is needed for landing hero and intake modal right now | |
| You decide | Scaffold core six primitives matching DESIGN.md §5.1 | |

**User's choice:** Core six primitives (button, card, badge, dialog, sheet, slider).
**Notes:** Exactly covers all Phase 1 & Phase 2 UI requirements without premature bloat.

### Existing Phase 1 Component Refactor

| Option | Description | Selected |
|--------|-------------|----------|
| Fully refactor Phase 1 components to shadcn primitives | Upgrade BriefModal to shadcn Dialog, BudgetLineCard to shadcn Card, pills to shadcn Badge/Button, unifying visual language across whole app | ✓ |
| Apply CSS tokens globally without rewriting component internals | Update tailwind.config and globals.css so existing markup inherits tokens | |
| Hybrid refactor | Refactor landing page, navigation, and BriefModal now; leave workspace internals for Phase 5 | |
| You decide | Ensure entire app meets DESIGN.md consistency | |

**User's choice:** Fully refactor Phase 1 components to shadcn primitives.
**Notes:** Prevents visual inconsistency between hero and workspace; guarantees complete 3-hue token adherence.

### Google Fonts Loading Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js next/font/google with CSS variables | Use Next.js font optimization in layout.tsx (--font-fraunces, --font-jakarta, --font-tiro) mapped to Tailwind classes font-serif, font-sans, font-devanagari with zero layout shift | ✓ |
| Retain Google Fonts CDN link in head | Keep current <link> tag setup in layout.tsx and configure Tailwind family fallbacks | |
| Self-hosted WOFF2 fonts in public/ | Store local font files for zero external network dependency | |
| You decide | Use next/font/google for production-grade SSR performance | |

**User's choice:** Next.js next/font/google with CSS variables.
**Notes:** Standard Next.js best practice for zero layout shift and automatic font subsetting.

### WCAG AAA Verification & Anti-Pattern Prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest design token & contrast test suite | Automated test verifying token contrast ratios and asserting that shadcn button/badge primitives enforce Plum text and ban white-on-pastel combinations | ✓ |
| Tailwind strict class enforcement | Custom Tailwind plugin that warns on prohibited color pairings | |
| Rely on DESIGN.md contract and visual inspection during verify step | Manual verification only | |
| You decide | Add a focused Vitest spec to maintain strict regression prevention | |

**User's choice:** Vitest design token & contrast test suite.
**Notes:** Structural testing guarantees that no accidental `text-white` on pastel slips in.

---

## Workspace Shell & Responsive Layout

### 3-Pane Desktop Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 3-column layout (35% Budget, 40% Timeline, 25% Explainer/Summary) | Left pane for budget lines & sliders, center for chronological milestone cards, right sticky column for live rebalancing explanations & undo history | ✓ |
| Split 2-pane (50/50 Budget & Timeline) with slide-over Change Drawer | Maximum width for budget and timeline, with a floating toast/drawer for change logs | |
| Equal 3-column balanced grid (33% / 33% / 33%) | Clean geometric symmetry across all 3 panes | |
| You decide | 35/40/25 layout offering spacious milestone viewing | |

**User's choice:** 3-column layout (35% Budget, 40% Timeline, 25% Explainer/Summary).
**Notes:** Gives the backwards timeline comfortable breathing room while maintaining continuous visibility of the live change explainer.

### Mobile Navigation Destinations

| Option | Description | Selected |
|--------|-------------|----------|
| [Budget, Timeline, Style/Ideas, Summary] tabs with bottom change sheet | Aligns with upcoming phases (Style DNA in Phase 4) and provides a bottom sheet handle for rebalance logs and undo | ✓ |
| [Budget, Timeline, Vendors, Share] tabs | Focuses on commercial coordination and sharing links | |
| [Overview, Budget, Timeline, History] tabs | Direct mirror of desktop 3-pane structure + changelog | |
| You decide | Standard [Budget, Timeline, Style, Summary] with bottom sheet drawer | |

**User's choice:** [Budget, Timeline, Style/Ideas, Summary] tabs with bottom change sheet.
**Notes:** Perfectly sets up the stage for the Phase 4 Style DNA swatch selector while keeping mobile re-balancing tactile.

### Change Explainer & Undo UX

| Option | Description | Selected |
|--------|-------------|----------|
| Versioned change cards with One-Click Undo | Plain-language explanation card ('Guest count changed to 350: Allocated +₹45,000 to Catering, balanced from Decor; Protected Moment untouched') with 1-click Undo button | ✓ |
| Floating notification toast with Undo | Compact floating pill at bottom-right that expands into change details on click | |
| Inline delta tags only | Keep all feedback inline on budget and timeline cards without dedicated changelog feed | |
| You decide | Dedicated versioned cards with 1-click Undo per PRD §4.1 | |

**User's choice:** Versioned change cards with One-Click Undo.
**Notes:** Gives non-technical organizers complete confidence and instant reversibility when experimenting with budget allocations.

### Transition between Hero and Workspace

| Option | Description | Selected |
|--------|-------------|----------|
| Smooth layout crossfade with celebratory counter settle | Hero fades gracefully into 3-pane workspace, numbers roll in via tabular-nums, and milestone cards stagger gently into position | ✓ |
| Instant swap | Instant cut to workspace with zero transition animation for maximum snappy performance | |
| Full-page slide-up transition | Workspace glides in from bottom over hero | |
| You decide | Spring crossfade with tabular numbers per DESIGN.md §7.2 | |

**User's choice:** Smooth layout crossfade with celebratory counter settle.
**Notes:** Celebrates the creation of the plan while maintaining continuity without abrupt UI flashing.

---

## the agent's Discretion

- Drawing routines for petal silhouettes on the Canvas layer.
- Responsive breakpoints for collapsing the 3-pane layout into tablet and mobile drawer modes.
- Micro-timing parameters for the One-Click Undo card dismiss transition.

## Deferred Ideas

- None — discussion stayed strictly within Phase 2 scope.
