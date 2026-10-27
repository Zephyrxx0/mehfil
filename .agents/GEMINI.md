<!-- GSD:project-start source:PROJECT.md -->

## Project

**Mehfil (महफ़िल)**

Mehfil (महफ़िल) is an intelligent, interconnected planning workspace for milestone celebrations (weddings, milestone birthdays, cultural gatherings) where budget, timeline, vendors, and personalized ideas form a single mathematically linked plan. When an organizer changes guest count, dates, or vendor quotes, the entire plan re-balances dynamically with visible plain-language explanations and one-click undo. Built for non-technical family organizers and community volunteers who need reassurance and financial precision rather than complex spreadsheets or generic chatbot advice.

**Core Value:** Words from models, numbers from code: the planning engine guarantees mathematical consistency, immutable versioned re-balancing, and protected floors across budget and timeline, ensuring a family's celebration budget can never be distorted by model arithmetic errors or prompt injection.

### Constraints

- **Arithmetic Ownership**: Pure code owns all figures and dates. Models are structurally banned from generating monetary amounts or dates.
- **Currency & Precision**: All financial amounts are stored and calculated as integers in paise (`INR`), avoiding any floating-point rounding errors.
- **Palette Discipline**: Maximum 3 pastel hues (Ivory, Marigold, Rose) with Plum ink; pastels are fills only, never text; WCAG AAA 4.5:1+ contrast mandatory.
- **Timeline Limits**: 7-day build cycle for virtual competition; strict P0 prioritization with Day-1 gates.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js (App Router)** | `15.x` | Full-stack React framework & SSR/Edge runtime | Zero-config Vercel hosting, React Server Components for private API key isolation, and fast streaming SSR. |
| **TypeScript** | `5.6+` | Type safety and domain contracts | Strict schema matching between engine, database, and client; prevents arithmetic and state mutation bugs. |
| **Vercel AI SDK** | `v4.x` (`@ai-sdk/google`) | Structured output & agent pipelines | Native Zod schema generation, streaming support, and seamless fallback between Gemma 4 and Gemini Flash. |
| **Google Gemma 4 / Gemini Flash** | `Gemma 4 31B` / `Gemini 2.0 Flash` | Vision extraction & layout curation | Gemma 4 provides open weights and cheap structured generation; Gemini Flash serves as the Tier-2 instant fallback. |
| **Supabase (PostgreSQL)** | `Postgres 16` | Relational state & RLS | Native Row-Level Security, anonymous auth sessions, JSONB support for version snapshots, and deferred constraints. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **shadcn/ui** | Latest | Design system component primitives | Foundation for all UI (dialogs, cards, sliders, sheets) styled with Mehfil 3-hue tokens. |
| **Tailwind CSS** | `3.4+` | Utility styling and CSS variable tokens | Provides design system tokens (`--background`, `--primary`, `--secondary`, `--border`) without CSS bloat. |
| **Motion** (formerly Framer Motion) | `11.x` | Component enter/exit and layout animations | Re-balancing number counter animations, bottom sheet reveals, and tactile button feedback. |
| **GSAP** | `3.12+` | Choreographed landing and reveal timelines | Cinematic landing page headline reveals, Style DNA card assembly, and timeline scroll choreography. |
| **Lenis** | `1.1+` | Smooth viewport scrolling | Landing page and long retrospective plan views (disabled when `prefers-reduced-motion` is active). |
| **Zod** | `3.23+` | Runtime validation & schema contracts | Input boundaries, Quote Analyst schemas, Generative UI closed registry validation, and DB models. |

### Development & Verification Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Package manager | Mandated by user global rules; fast, space-efficient, strict symlink dependency tree. |
| **fallow** | Dead code and linting CLI | User rule; clean codebase remediation. |
| **graphify** | Codebase mapping | User rule; keeps architectural knowledge graph updated in `.planning/graphs/`. |
| **obscura** | Headless browser automation | User rule; automated UI verification and end-to-end testing. |

## Installation

# Core

# UI & Styling

# Animation & Smooth Scroll

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Supabase (Postgres)** | Firebase Firestore | Use Firebase for heavy real-time presence/multi-user chat; Postgres was chosen for integer money arithmetic and immutable plan version foreign keys. |
| **shadcn/ui** | Material UI / Chakra | Use pre-bundled component kits if rapid unbranded mockups are needed; shadcn was chosen for radical copy-paste styling into custom tokens. |
| **Motion + GSAP** | Anime.js | Anime.js was explicitly dropped to prevent bundle weight overlap since Motion and GSAP cover all spring physics, SVG strokes, and timelines. |
| **Integer Paise (INR)** | JavaScript Floats | Floating-point IEEE-754 causes rounding discrepancies (e.g. `0.1 + 0.2 !== 0.3`); integer paise guarantees exact sums with largest-remainder rounding. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Model-Computed Arithmetic** | LLMs hallucinate numbers and cannot maintain consistent sums across prompt turns | Pure TypeScript arithmetic engine with integer paise |
| **Direct Model HTML/Code Execution** | Extreme XSS and prompt injection vulnerability | Closed Registry with Entity ID Binding (ADR-0008) |
| **Redis Cache Cluster** | Unnecessary infrastructure overhead for 7-day build | Postgres caching and rate-limiting tables (PRD Section 9.5) |
| **Heavy Client Auth SDKs (NextAuth/Auth0)** | Causes massive onboarding drop-off for family milestone planning | Supabase Anonymous auth + capability Edit Keys (ADR-0006) |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
