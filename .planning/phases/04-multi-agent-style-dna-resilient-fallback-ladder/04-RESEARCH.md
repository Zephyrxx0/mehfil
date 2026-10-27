# Phase 4: Multi-Agent Style DNA & Resilient Fallback Ladder - Research

**Date:** 2026-10-27  
**Status:** Complete & Ready for Planning  
**Target:** Phase 04 Planning (VIBE-01, VIBE-02, VIBE-03, VIBE-04, GENUI-03)

---

## 1. User Constraints (from CONTEXT.md)

*The following implementation decisions are verbatim from `04-CONTEXT.md` and locked for Phase 4 planning:*

### Vibe Intake UX & Swatch Gallery
- **D-01:** Sequential step in intake wizard: Brief form $\rightarrow$ Vibe Gallery (swatches + moment + trade-offs) $\rightarrow$ Instant v1 baseline with animated v2 reveal. Keeps onboarding cohesive without extra navigation steps. — *Reversibility: reversible*
- **D-02:** Hybrid local WebP assets in `/public/swatches/` paired with festive tags, palette metadata, and SVG placeholder fallbacks. Guarantees fast, offline-safe operation and zero external network latency. — *Reversibility: costly — asset storage and metadata registry contract*
- **D-03:** Strict 6–8 selection counter with celebratory pill ('Pick 6 to 8 vibes (X/8 selected)') and quick preset filters (e.g. 'Royal Heritage', 'Garden Pastel', 'Minimalist Festive'). 'Continue' button enables only when 6 $\le$ count $\le$ 8. — *Reversibility: reversible*
- **D-04:** Two-step micro-wizard inside Vibe Intake: Step 3A (Pick 6–8 Swatches) $\rightarrow$ Step 3B (Protected Moment sentence input & 3 Forced-Choice Trade-offs: Feast/Spectacle, Intimate/Grand, Heritage/Modern). — *Reversibility: reversible*

### Style DNA Calibration & Planner Multipliers
- **D-05:** Comprehensive 8-axis profile: Formality, Energy, Scale, Heritage vs Modern, Feast vs Spectacle, Music, Decor Density, Indoor vs Outdoor (each bounded 0–100) + Named Palette (3–4 hues) + 1-sentence vibe statement. Matches PRD §3.2. — *Reversibility: costly — impacts Zod schema and engine modulation contracts*
- **D-06:** Clamping bounds of $\pm$25% (`[0.75x, 1.25x]` multiplier per category line): gives meaningful, noticeable festive leaning while preserving structural budget safety and preventing model distortion. — *Reversibility: costly — arithmetic invariant contract*
- **D-07:** Protected Moment mapping: Style Analyst maps sentence to closest budget line category + locks a 1.25x floor multiplier, tagging the line with the exact user quote and rose badge. — *Reversibility: reversible*
- **D-08:** Interactive Style DNA Card at the top of Pane 3 (Desktop) and Drawer (Mobile) with dimension pills, named palette swatches, and an 'Edit Style DNA' button that opens a slider sheet to retune values and recalculate. — *Reversibility: reversible*

### v2 Plan Reveal & Transition Choreography
- **D-09:** Two-beat reveal: Instant workspace arrival showing baseline v1 (<10ms), followed by a 1.2s smooth GSAP/Motion re-balance bar animation as Style DNA finishes, highlighting what shifted with zero blank wait screens. — *Reversibility: reversible*
- **D-10:** Highlighted v2 Change Banner + auto-updated ChangeExplainer in Pane 3 with plain-language rationale: 'Infused [Vibe Name]: Elevated Decor (+₹X) and Entertainment (+₹Y); Protected Moment held firm at floor.' — *Reversibility: reversible*
- **D-11:** Dedicated 'Reset to Baseline (v1)' action inside Style DNA card menu, plus standard 1-click forward restore in Version History. — *Reversibility: reversible*
- **D-12:** Full accessible motion: Spring physics on budget bars and counter numbers, with automatic zero-delay instant snaps when `prefers-reduced-motion` is active. — *Reversibility: reversible*

### Fallback Ladder & Calm Degradation
- **D-13:** 8-second timeout for Tier 1 (Gemma 4) with 1 immediate zero-temp schema-repair retry, escalating immediately to Gemini 2.0 Flash (Tier 2) before dropping to deterministic Tier 3. — *Reversibility: costly — pipeline orchestrator architecture*
- **D-14:** Calm reassuring note on Style DNA card when degrading to Tier 3: 'Showing standard style profile for now; your custom vibe will be infused when you retry' with a subtle 'Retry Extraction' button. Zero alarming error dialogs. — *Reversibility: reversible*
- **D-15:** Structured Run Records attached directly to plan_version metadata (`meta.run_record`: active_tier, duration_ms, model_id, fallback_reason) + structured JSON console logging. Transparent with zero extra migration table needed. — *Reversibility: costly — version metadata schema contract*
- **D-16:** Seamless local mock/heuristic: if no API key is present in environment, seamlessly execute Tier 3 deterministic extractor with a friendly dev console log. 100% testable out-of-the-box. — *Reversibility: reversible*

### Agent Discretion
- Exact swatch filenames, titles, tags, and palette hex definitions in `/public/swatches/swatches.json` and `src/data/swatches.json`.
- Specific prompt wording for Style Analyst and Planner within Vercel AI SDK structured generation pipelines.
- Micro-interactions on swatch card selection (subtle gold ring, checkmark badge, and spring pop).
- Heuristic fallback scoring algorithm mapping swatch tags and trade-offs directly to the 8-dimension profile.

---

## 2. Phase Requirements Coverage

| Requirement ID | Description | Phase 4 Implementation Strategy |
|---|---|---|
| **VIBE-01** | User can select 6 to 8 visual references from a curated gallery of 24 licensed Style Swatches (ADR-0009). | Create 24 curated swatches registry (`src/data/swatches.json`) with hybrid local assets (`/public/swatches/`) + SVG vector fallbacks. Implement `StepVibeSwatches.tsx` in `BriefModal` with celebratory counter pill ('Pick 6 to 8 vibes (X/8 selected)') and preset filters ('Royal Heritage', 'Garden Pastel', 'Minimalist Festive', 'High Energy Mela', 'Intimate Classic'). Block progression until $6 \le \text{count} \le 8$. |
| **VIBE-02** | User can input single-sentence Protected Moment and answer three forced-choice trade-off pairs. | Implement `StepVibeTradeoffs.tsx` with a single-line input for the Protected Moment (e.g., "Live soulful qawwali night under fairy lights") and 3 tactile binary cards: (1) Feast vs Spectacle, (2) Intimate vs Grand, (3) Heritage vs Modern. |
| **VIBE-03** | Style Analyst extracts structured Style DNA (8 bounded dimensions [0–100], named palette, 1-sentence vibe statement) via vision/vibe analysis. | Define strict Zod schema `StyleDNASchema`. System prompt strictly prohibits inferring demographic, ethnic, or religious identity from aesthetics. Map user quote to closest budget line category. |
| **VIBE-04** | Planner applies bounded multiplier modulation to baseline weights, producing an audited v2 version diff with plain-language rationale. | Pure TypeScript style modulation engine `src/lib/engine/style.ts`. Clamps category multipliers strictly to $[0.75x, 1.25x]$ ($\pm 25\%$). Locks $1.25x$ floor multiplier on the Protected Moment category. Computes integer paise allocations using Hare-Niemeyer largest-remainder method. Renders v2 Change Banner and records plain-language audit trail. |
| **GENUI-03** | Three-tier fallback ladder (Gemma repair retry $\rightarrow$ Gemini Flash cloud escalation $\rightarrow$ static template fallback) ensures zero-failure operation during live demos (ADR-0007). | Implement `src/lib/ai/orchestrator.ts`: Tier 1 (Gemma 4 with 8s `AbortSignal.timeout` + 1 zero-temp schema repair retry), Tier 2 (Gemini 2.0 Flash escalation), Tier 3 (pure deterministic heuristic extractor). Produces structured `AgentRunRecord`. If API keys are absent, runs Tier 3 seamlessly with dev log. Renders calm degradation note on Style DNA card without alarming dialogs. |

---

## 3. Standard Stack & Libraries

### Package Verification & Status

| Package | Version Verified | Role in Phase 4 | Installation Command / Notes |
|---|---|---|---|
| `ai` | `^7.0.153` (Vercel AI SDK) | Core structured generation (`generateObject`) | Installed. Native Zod schema generation and abort controller support. |
| `@ai-sdk/google` | `^4.0.105` | Google provider for Gemma 4 and Gemini 2.0 Flash | Installed. Supports `google('gemma-4-31b-it')` and `google('gemini-2.0-flash')`. |
| `zod` | `^4.6.7` (or `^3.25.76`) | Runtime contracts, bounds validation (`min(0).max(100)`), and repair | Installed. Provides `.safeParse()` error paths for schema-repair retry loops. |
| `motion` (`motion/react`) | `^14.6.0` | 1.2s smooth re-balance bar animation, spring physics, `useReducedMotion()` | Pre-installed. Verified functional with React 19. |
| `gsap` | `^3.15.0` | Optional choreographed timeline sequencing | Installed and verified. |
| `@radix-ui/react-slider` | `^1.6.1` | "Edit Style DNA" slider knobs for retuning the 8 dimensions | Pre-installed in `src/components/ui/slider.tsx`. |

### Environment Variables Contract
```env
# Server-side only (never expose in NEXT_PUBLIC_)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy... # Or GEMINI_API_KEY
```
*Note on D-16:* When `GOOGLE_GENERATIVE_AI_API_KEY` is undefined (e.g. during CI or offline local development), the orchestrator immediately falls back to Tier 3 without attempting network connections.

---

## 4. Architecture Patterns

```
                                  [ User Vibe Intake ]
                        (6-8 Swatches + Moment Quote + 3 Trade-offs)
                                           │
                                           ▼
                       Beat 1: Instant v1 Baseline (<10ms)
                     (Instantiated directly from Archetype)
                                           │
                                           ▼
                   [ Fallback Ladder Orchestrator (ADR-0007) ]
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
      Tier 1: Gemma 4              Tier 2: Gemini Flash          Tier 3: Heuristic
   • 8s timeout                 • Escalation if T1 fails      • Pure TS deterministic
   • 1 schema repair retry      • 8s timeout                  • Zero network / Zero key
   • Model: gemma-4-31b-it      • Model: gemini-2.0-flash     • <5ms instant execution
              └────────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
                         [ Output Guard & Invariant Engine ]
                               (src/lib/engine/style.ts)
                 • Safeguard: Zero demographic/identity inference
                 • Bounded Multipliers: Clamped strictly to [0.75x, 1.25x]
                 • Protected Moment: Locked 1.25x floor multiplier + rose badge
                 • Hare-Niemeyer largest-remainder integer paise apportionment
                                           │
                                           ▼
                         Beat 2: Smooth v2 Reveal Animation
                      • 1.2s smooth spring re-balance animation
                      • Zero-delay instant snap if prefers-reduced-motion
                      • Highlighted v2 Change Banner & Explainer in Pane 3
                      • Style DNA Card at top of Pane 3 with Retune Sheet
```

### Component & Module Layout
1. `src/data/swatches.json` & `public/swatches/`:
   - 24 curated swatches with IDs, festive titles, descriptions, preset filter tags, 3-4 palette hexes, dimension biases (0-100), and SVG vector fallbacks.
2. `src/lib/ai/schemas.ts`:
   - Strict Zod schemas for `StyleDNA`, `StyleDimensions`, `PlannerModulation`, and `AgentRunRecord`.
3. `src/lib/ai/style-analyst.ts` & `src/lib/ai/planner.ts`:
   - Specialized prompt templates and Vercel AI SDK callers.
   - Strictly tool-less; model outputs only dimensions, palette, vibe statement, and category multipliers.
4. `src/lib/ai/heuristic.ts`:
   - Deterministic Tier 3 fallback extractor mapping selected swatches + 3 trade-offs + keyword scanning on moment quote into valid Style DNA and bounded multipliers.
5. `src/lib/ai/orchestrator.ts`:
   - Three-tier resilient fallback ladder orchestrating Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3, tracking latency, logging JSON telemetry, and attaching `AgentRunRecord`.
6. `src/lib/engine/style.ts`:
   - Pure functional budget modulation: applies multipliers $\rightarrow$ clamps $[0.75, 1.25]$ $\rightarrow$ locks 1.25x protected floor $\rightarrow$ guest scaling $\rightarrow$ Hare-Niemeyer integer paise apportionment.
7. `src/components/intake/StepVibeSwatches.tsx` & `src/components/intake/StepVibeTradeoffs.tsx`:
   - Step 3A & 3B micro-wizard inside `BriefModal.tsx`.
8. `src/components/workspace/StyleDNACard.tsx` & `src/components/workspace/StyleDNARetuneSheet.tsx`:
   - Interactive card at top of Pane 3 / Mobile Drawer with dimension pills, named palette dots, "Edit Style DNA" slider sheet, and "Reset to Baseline (v1)" action.
9. `src/components/workspace/V2ChangeBanner.tsx`:
   - Highlighted celebratory banner signaling the v1 $\rightarrow$ v2 upgrade.

---

## 5. Don't Hand-Roll (Established Libraries vs Custom Code)

| Task | DO NOT Hand-Roll | Use Instead | Why |
|---|---|---|---|
| **Multi-model SDK** | Custom `fetch('https://generativelanguage.googleapis.com/...')` wrappers | `ai` + `@ai-sdk/google` (`generateObject`) | Standardized typed schema outputs, provider switching, token usage tracking, and automated JSON cleaning. |
| **Schema Validation & Parsing** | Custom regex or type asserts | `zod` (`.safeParse()`) | Guarantees bounded numbers (`min(0).max(100)`), array lengths, regex hex codes, and generates exact error messages for repair retries. |
| **Money Allocation** | Floating-point division (`budget * 0.35`) | `apportionRupees` (Hare-Niemeyer largest-remainder) in `src/lib/engine/budget.ts` | Eliminates IEEE-754 floating-point drift and guarantees line allocations sum exactly to the total budget integer paise. |
| **Reduced Motion Detection** | Manual DOM event listeners and media query parsing | `useReducedMotion()` from `motion/react` | React 19 SSR-safe, automatically updates on OS preference changes, zero boilerplate. |
| **Spring Physics & Bar Transitions** | CSS transition keyframes or `setInterval` tick counters | `motion.div` layout animations with spring physics | Handles interrupted animations cleanly during rapid slider adjustments without UI stutter. |

---

## 6. Common Pitfalls & Edge Cases

### 1. Latency Spikes & Judge Demo Freezes (ADR-0007, D-13)
- **Pitfall:** Gemma 4 or cloud API hangs for 15+ seconds during a live presentation, trapping user on a loading screen.
- **Prevention:** Wrap every model call in `AbortSignal.timeout(8000)`. If Tier 1 exceeds 8,000ms, immediately abort and escalate to Tier 2. If Tier 2 exceeds 8,000ms, immediately abort and execute Tier 3 (<5ms). User never waits more than a few seconds.

### 2. Infinite Repair Loops
- **Pitfall:** Model output repeatedly fails schema validation, burning quota and causing infinite retry cycles.
- **Prevention:** Enforce a strict limit of **exactly 1 repair retry** at `temperature: 0`. If the repaired output still fails schema validation, immediately escalate to the next tier.

### 3. Identity & Demographic Inference Safeguard (PRD §3.2, D-05)
- **Pitfall:** Vision model sees ethnic attire or cultural decor and hallucinates religious or caste assumptions in the vibe statement.
- **Prevention:** Structural and prompt safeguards:
  1. System prompt strictly forbids inferring demographic, ethnic, religious, or health attributes.
  2. Zod schema contains *zero fields* for religion, ethnicity, or caste.
  3. Free-text vibe statement is capped at 200 characters and describes only sensory ambiance, color, lighting, and decor.

### 4. Floating-Point Multiplier Distortion (ADR-0008, D-06)
- **Pitfall:** Unchecked model multipliers like $0.2x$ or $3.5x$ completely collapse or balloon categories, breaking budget feasibility.
- **Prevention:** Strict two-stage clamping:
  1. Zod schema: `z.number().min(0.75).max(1.25)`
  2. Engine invariant guard: `Math.min(1.25, Math.max(0.75, multiplier))` before weight calculation.
  3. Engine owns all numbers: models output relative weights; engine converts to integer paise.

### 5. Swatch Image Loading Latency & Offline Breakage (ADR-0009, D-02)
- **Pitfall:** Remote images fail to load in offline environments or mobile slow networks, showing broken image icons.
- **Prevention:** Local WebP assets in `/public/swatches/` paired with embedded inline SVG placeholder fallbacks. Swatches render instantly even with no internet connection.

### 6. Accessibility & Motion Sensitivity (D-12)
- **Pitfall:** Sudden aggressive bar expansion or spring jitter triggers vestibular discomfort for users who prefer reduced motion.
- **Prevention:** Check `useReducedMotion()`. When true, animation duration is 0ms with instant snap to final width and numbers.

---

## 7. Code Examples

### A. Vercel AI SDK `generateObject` with 1-Shot Schema Repair Retry
```typescript
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { StyleDNASchema, type StyleDNA } from './schemas'

export async function runStyleAnalystTier1(
  prompt: string,
  timeoutMs = 8000
): Promise<StyleDNA> {
  const model = google('gemma-4-31b-it')

  try {
    const { object } = await generateObject({
      model,
      schema: StyleDNASchema,
      system: `You are the Mehfil Style Analyst. Analyze festive visual references and extract structured aesthetic Style DNA.
STRICT SAFEGUARD: Describe aesthetics, decor, lighting, atmosphere, colors, and objects ONLY. Never infer, mention, or speculate on religion, caste, ethnicity, health, or demographic identity.`,
      prompt,
      abortSignal: AbortSignal.timeout(timeoutMs),
      temperature: 0.2,
    })
    return object
  } catch (err: any) {
    // 1-Shot Repair Retry at temperature 0 (D-13)
    if (err.name !== 'TimeoutError' && err.name !== 'AbortError') {
      const repairPrompt = `The previous output failed validation: ${err.message}. Please correct the JSON output to strictly match the schema.`
      const { object: repaired } = await generateObject({
        model,
        schema: StyleDNASchema,
        system: `You are repairing invalid JSON. Output strictly valid JSON matching the schema.`,
        prompt: `${prompt}\n\n${repairPrompt}`,
        abortSignal: AbortSignal.timeout(Math.max(2000, timeoutMs - 3000)),
        temperature: 0,
      })
      return repaired
    }
    throw err
  }
}
```

### B. Tier 3 Deterministic Heuristic Extractor (<5ms, Zero-Network)
```typescript
import type { StyleDNA, StyleDimensions } from './schemas'
import { SWATCHES } from '@/data/swatches'

export function extractDeterministicStyleDNA(
  selectedSwatchIds: string[],
  protectedMomentText: string,
  tradeoffs: {
    feastVsSpectacle: 'feast' | 'spectacle'
    intimateVsGrand: 'intimate' | 'grand'
    heritageVsModern: 'heritage' | 'modern'
  }
): StyleDNA {
  const swatches = selectedSwatchIds
    .map((id) => SWATCHES.find((s) => s.id === id))
    .filter(Boolean)

  // 1. Blend dimension biases from selected swatches
  const count = swatches.length || 1
  const baseDim: StyleDimensions = {
    formality: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.formality, 0) / count),
    energy: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.energy, 0) / count),
    scale: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.scale, 0) / count),
    heritageVsModern: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.heritageVsModern, 0) / count),
    feastVsSpectacle: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.feastVsSpectacle, 0) / count),
    music: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.music, 0) / count),
    decorDensity: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.decorDensity, 0) / count),
    indoorVsOutdoor: Math.round(swatches.reduce((sum, s) => sum + s!.dimensions.indoorVsOutdoor, 0) / count),
  }

  // 2. Modulate dimensions with forced-choice trade-offs
  if (tradeoffs.feastVsSpectacle === 'feast') baseDim.feastVsSpectacle = Math.max(10, baseDim.feastVsSpectacle - 25)
  else baseDim.feastVsSpectacle = Math.min(90, baseDim.feastVsSpectacle + 25)

  if (tradeoffs.intimateVsGrand === 'intimate') baseDim.scale = Math.max(15, baseDim.scale - 25)
  else baseDim.scale = Math.min(90, baseDim.scale + 25)

  if (tradeoffs.heritageVsModern === 'heritage') baseDim.heritageVsModern = Math.max(10, baseDim.heritageVsModern - 25)
  else baseDim.heritageVsModern = Math.min(90, baseDim.heritageVsModern + 25)

  // 3. Keyword heuristic for Protected Moment category mapping
  const lowerMoment = protectedMomentText.toLowerCase()
  let protectedCategory: any = 'catering'
  if (/music|qawwali|dj|band|singer|dance|sangeet|dhol/.test(lowerMoment)) protectedCategory = 'entertainment'
  else if (/photo|film|video|shoot|album|drone/.test(lowerMoment)) protectedCategory = 'photo_film'
  else if (/flower|mandap|decor|light|chandelier|stage|entry/.test(lowerMoment)) protectedCategory = 'decor'
  else if (/venue|palace|haveli|hall|lawn|resort/.test(lowerMoment)) protectedCategory = 'venue'
  else if (/food|feast|dinner|mithai|chaat|dessert|cocktail/.test(lowerMoment)) protectedCategory = 'catering'
  else if (/gift|favor|potli|box|hamper/.test(lowerMoment)) protectedCategory = 'favors'

  // 4. Palette extraction from dominant swatch colors
  const primaryPalette = swatches[0]?.palette || ['#F7C873', '#F2A7B8', '#3A2442', '#FFF8EE']

  return {
    dimensions: baseDim,
    namedPalette: primaryPalette.map((hex, i) => ({
      name: ['Marigold Amber', 'Gulabi Rose', 'Royal Plum', 'Warm Ivory'][i] || `Shade ${i + 1}`,
      hex,
    })),
    vibeStatement: `A celebration infused with ${swatches.map((s) => s!.title).slice(0, 2).join(' & ')}, emphasizing ${protectedCategory.replace('_', ' ')}.`,
    protectedCategory,
    protectedMomentQuote: protectedMomentText,
  }
}
```

### C. Bounded Multiplier Modulation & Integer Paise Rebalance (`style.ts`)
```typescript
import type { Plan, BudgetLine, BudgetCategory } from '@/lib/engine/types'
import { apportionRupees } from '@/lib/engine/budget'
import type { StyleDNA } from '@/lib/ai/schemas'

export function applyStyleModulationToPlan(plan: Plan, styleDNA: StyleDNA): Plan {
  const { dimensions, protectedCategory, protectedMomentQuote } = styleDNA

  // Compute raw multipliers from 8 dimensions bounded [0.75, 1.25]
  const rawMultipliers: Record<BudgetCategory, number> = {
    entertainment: 0.75 + (dimensions.music / 100) * 0.50,
    decor: 0.75 + (dimensions.decorDensity / 100) * 0.50,
    catering: 1.25 - (dimensions.feastVsSpectacle / 100) * 0.50,
    venue: 0.75 + ((dimensions.scale + dimensions.formality) / 200) * 0.50,
    photo_film: 0.75 + (dimensions.formality / 100) * 0.50,
    contingency: 0.75 + (dimensions.indoorVsOutdoor / 100) * 0.50,
    favors: 0.75 + ((100 - dimensions.scale) / 100) * 0.50,
    misc: 1.0,
  }

  // Lock 1.25x floor multiplier on Protected Moment category (D-07)
  rawMultipliers[protectedCategory] = 1.25

  // Enforce strict clamping invariant [0.75, 1.25] (D-06)
  const multipliers: Record<BudgetCategory, number> = {} as any
  for (const cat in rawMultipliers) {
    const k = cat as BudgetCategory
    multipliers[k] = Math.min(1.25, Math.max(0.75, rawMultipliers[k]))
  }

  // Modulate baseline ratios
  const baselineWeights = plan.lines.map((l) => l.baselinePaise / plan.totalBudgetPaise)
  const modulatedWeights = plan.lines.map((l, i) => baselineWeights[i] * multipliers[l.category])
  const sumWeights = modulatedWeights.reduce((a, b) => a + b, 0)
  const normalizedRatios = modulatedWeights.map((w) => w / sumWeights)

  // Apportion integer paise with Hare-Niemeyer largest-remainder method
  const newPaiseAllocations = apportionRupees(plan.totalBudgetPaise, normalizedRatios)

  const updatedLines: BudgetLine[] = plan.lines.map((line, i) => {
    const isProt = line.category === protectedCategory
    return {
      ...line,
      currentPaise: newPaiseAllocations[i],
      isProtected: isProt,
      ...(isProt ? { protectedQuote: protectedMomentQuote } : {}),
    }
  })

  return {
    ...plan,
    lines: updatedLines,
    brief: {
      ...plan.brief,
      protectedCategory,
      vibeStatement: styleDNA.vibeStatement,
      protectedMomentQuote,
    },
    styleDNA,
  }
}
```

---

## 8. Validation Architecture

### Nyquist Test Matrix

| Area | Test Suite | Target Invariants | Verification Command |
|---|---|---|---|
| **Swatches Registry** | `tests/engine/swatches.test.ts` | • Exactly 24 swatches with unique IDs<br>• Valid palette hexes (3–4 each)<br>• Dimensions in range $[0, 100]$<br>• SVG fallback validity | `pnpm vitest run tests/engine/swatches.test.ts` |
| **Style Modulation Engine** | `tests/engine/style.test.ts` | • Multipliers strictly clamped to $[0.75, 1.25]$<br>• Protected moment category locks $1.25x$ floor<br>• Integer paise sum invariant: $\sum \text{currentPaise} === \text{totalBudgetPaise}$<br>• Zero negative allocations | `pnpm vitest run tests/engine/style.test.ts` |
| **Fallback Ladder Orchestrator** | `tests/ai/orchestrator.test.ts` | • Tier 1 success returns `activeTier: 1`<br>• Schema error triggers 1-shot repair retry<br>• 8s timeout triggers Tier 2 escalation<br>• Tier 2 failure triggers Tier 3 fallback<br>• Missing API key seamlessly runs Tier 3<br>• `AgentRunRecord` telemetry verified | `pnpm vitest run tests/ai/orchestrator.test.ts` |
| **Vibe Intake UX** | `tests/components/VibeIntake.test.tsx` | • 24 swatches render with filter tags<br>• Celebratory counter updates ($X/8$ selected)<br>• Next button disabled when $<6$ or $>8$<br>• Step 3B captures moment & 3 trade-offs | `pnpm vitest run tests/components/VibeIntake.test.tsx` |
| **v2 Reveal & Style DNA Card** | `tests/components/StyleDNACard.test.tsx` | • Baseline v1 plan loads immediately<br>• v2 banner displays plain-language rationale<br>• Reduced-motion setting enforces instant snap<br>• "Edit Style DNA" retunes sliders and recalculates<br>• "Reset to Baseline (v1)" restores v1 plan<br>• Calm degradation note renders when Tier 3 active | `pnpm vitest run tests/components/StyleDNACard.test.tsx` |

---

## 9. Planning Recommendations & Plan Breakdown

To implement Phase 4 cleanly within the GSD workflow, Phase 4 should be divided into **3 focused execution plans**:

1. **Plan 04-01: Curated Swatches, Style Schemas & Deterministic Modulation Engine**
   - 24-swatch visual asset library and registry (`src/data/swatches.json`, `public/swatches/`, SVGs).
   - Zod schemas (`src/lib/ai/schemas.ts`).
   - Pure functional style engine (`src/lib/engine/style.ts`) with bounded multiplier clamping $[0.75x, 1.25x]$ and Hare-Niemeyer integer paise rebalancing.
   - Deterministic Tier 3 heuristic extractor (`src/lib/ai/heuristic.ts`).
   - Unit tests for swatches, schemas, and arithmetic invariants.

2. **Plan 04-02: Three-Tier Fallback Ladder Orchestrator & Telemetry**
   - Vercel AI SDK integration with Gemma 4 (`gemma-4-31b-it`) and Gemini 2.0 Flash (`gemini-2.0-flash`).
   - 8-second `AbortSignal.timeout` latency control and 1-shot zero-temperature schema repair retry.
   - Resilient orchestrator (`src/lib/ai/orchestrator.ts`) with automated Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3 escalation.
   - Structured JSON logging and `AgentRunRecord` metadata attached to plan versions.
   - Integration tests mocking timeouts, schema errors, and missing API keys.

3. **Plan 04-03: Vibe Intake Micro-Wizard, Two-Beat Reveal & Style DNA Workspace Card**
   - Step 3A (24-Swatch Gallery with 6-8 counter and preset filters) and Step 3B (Protected Moment input & 3 trade-offs) in `BriefModal.tsx`.
   - Two-beat v2 reveal sequence: instant baseline v1 followed by 1.2s smooth re-balance bar animation with `prefers-reduced-motion` detection.
   - Highlighted v2 Change Banner and updated `ChangeExplainer` rationale.
   - Interactive `StyleDNACard` at top of Pane 3 and Mobile Drawer with named palette swatches, dimension pills, "Edit Style DNA" slider sheet, calm degradation note, and "Reset to Baseline (v1)" action.
   - Component test suites verifying the full intake-to-reveal flow.

---

## RESEARCH COMPLETE
