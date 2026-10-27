# Phase 02 Plan 02: Centerpiece Kinetic Hero with Devanagari & Canvas Ambient Layer Summary

**Plan ID:** 02-02  
**Phase:** 02 — Festive Design System & Centerpiece Kinetic Hero  
**Status:** Complete  
**Requirements Satisfied:** DESIGN-02, D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08  

---

## 1. Executive Summary

Plan 02-02 successfully created and integrated the centerpiece festive landing hero for Mehfil (महफ़िल). The implementation adheres strictly to the 3-hue design system (Warm Ivory `#FFF8EE`, Marigold `#F7C873`, Gulabi Rose `#F2A7B8`, and Royal Plum `#3A2442` text ink), typography standards (`Fraunces` variable soft serif, `Plus Jakarta Sans`, and `Tiro Devanagari Hindi`), high-performance HTML5 Canvas animation, and comprehensive accessibility features including reduced-motion modes.

---

## 2. Key Components Delivered

### 2.1 HTML5 Canvas Ambient Petals (`src/components/hero/CelebrationParticles.tsx`)
- **60fps Particle Physics:** Pure RAF loop rendering 30 petal particles drifting smoothly using cubic bezier curves (`ctx.bezierCurveTo`) in Marigold (`#F7C873`) and Gulabi Rose (`#F2A7B8`) with subtle alpha transparency (0.35–0.7).
- **Zero DOM / React Re-Render Bloat:** Coordinates, drift, and sway update directly inside the canvas animation loop without triggering React component re-renders.
- **High-DPI Display Scaling:** Scaled using `window.devicePixelRatio` for razor-sharp rendering on Retina screens.
- **Reduced Motion Safety:** Automatically halts RAF loop and clears the canvas when `prefers-reduced-motion` is active.

### 2.2 Ethereal Jali Watermark (`src/components/hero/JaliWatermark.tsx`)
- **8-Fold Symmetric Mandala:** Rendered in vector SVG with hairline plum stroke (`stroke-royal-plum` at `0.06` opacity).
- **120s Continuous Rotation:** Continuous ultra-slow rotation via CSS animation class `animate-spin-slow`.
- **Desktop Parallax Mouse Tilt:** Dampened translation offset (max ±6px on X and Y) using Motion `useSpring` (`stiffness: 100`, `damping: 30`) on desktop pointer devices (`(hover: hover) and (pointer: fine)`).
- **Reduced Motion Lock:** Rotational animation and mouse tilt are disabled when reduced motion is preferred.

### 2.3 Kinetic Display Headline (`src/components/hero/HeroHeadline.tsx`)
- **Fraunces Display Typography:** Styled in `font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-bold text-royal-plum tracking-[-0.03em] leading-[1.05]`.
- **Staggered Spring Entrance:** Staggered child word entrance with `stiffness: 120, damping: 18` and `40ms` stagger delay.
- **3.5s Slot-Machine Sentiment Roll:** The sentiment word cycles smoothly across celebration archetypes: `["Wedding", "Milestone", "Soirée", "Mehfil"]` in the sentence *"Where your [Archetype] moves in harmony."*
- **Physics & Transitions:** Wrapped in Motion `AnimatePresence mode="popLayout"`. Standard transitions use vertical translation (`y: [28, 0, -28]`) with celebratory spring (`stiffness: 120, damping: 18, mass: 1.2`) and blur filters. Under reduced motion, switches to a pure 200ms opacity cross-fade with zero vertical movement or blur.

### 2.4 Centerpiece Hero Section (`src/components/hero/HeroSection.tsx`) & Landing Integration (`src/app/page.tsx`)
- **Devanagari Brand Wordmark:** Features `"महफ़िल"` in `font-devanagari` paired with `"Mehfil — Words from models, numbers from code."` in `font-sans`.
- **Tactile Primary CTA Pill:** Prominent `"Start Your Mehfil"` button using `<Button variant="pill" size="hero">` (`h-14 px-8 rounded-full bg-marigold text-royal-plum font-bold text-lg active:scale-95 shadow-[0_8px_24px_-4px_rgba(247,200,115,0.45)]`) that opens the 3-step `BriefModal`.
- **Quick Launch Starter Chips:** Integrated `StarterChips` directly below CTA for 1-click archetype plan generation in <10ms.
- **3 Pillars Architecture Callouts:** Zero-Float Paise Precision, Protected Moment Immunity, and Backwards UTC Roadmap callouts displayed in Warm Ivory cards with hairline borders.

---

## 3. Verification & Test Coverage

### 3.1 Unit & Component Tests (`tests/components/Hero.test.tsx`)
- Verified headline rendering in `font-serif` Fraunces display typography.
- Verified 3.5s timer-driven archetype cycling (`Wedding -> Milestone -> Soirée -> Mehfil -> Wedding`).
- Verified Tiro Devanagari Hindi wordmark ("महफ़िल") and English subtitle presence.
- Verified primary CTA pill styling (`bg-marigold`, `text-royal-plum`, `active:scale-95`) and click behavior opening `BriefModal`.
- Verified 1-click starter chips and "Explore Sample Plan" trigger event plan instantiation.
- Verified reduced motion accessibility behavior freezes rotation and renders particle canvas safely.

### 3.2 Design Token & Contrast Verification (`tests/design/tokens.test.ts`)
- All 8 contrast tests pass: Royal Plum on Warm Ivory (`13.18:1`), Marigold (`8.91:1`), and Gulabi Rose (`7.28:1`) exceed WCAG AAA standards.
- AST source scanner verified zero instances of banned white text on pastels.

### 3.3 Test Suite & Production Build Results
- **Vitest Run:** 10 test files passed, 76/76 tests green.
- **Next.js Production Build:** `pnpm build` succeeded with zero TypeScript or bundling errors.

---

## 4. Git Commits

1. `a26e261`: `feat(02-02): add ambient canvas celebration particles and jali watermark`
2. `b963703`: `feat(02-02): implement kinetic hero headline, tactile cta pill, and hero section integration`
