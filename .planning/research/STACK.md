# Stack Research

**Domain:** AI-Augmented Milestone Celebration & Event Planning Engine  
**Researched:** 2026-10-27  
**Confidence:** HIGH  

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

```bash
# Core
pnpm add next@latest react@latest react-dom@latest ai @ai-sdk/google zod @supabase/supabase-js

# UI & Styling
pnpm add tailwindcss postcss autoprefixer class-variance-authority clsx tailwind-merge lucide-react

# Animation & Smooth Scroll
pnpm add motion gsap @gsap/react lenis vaul
```

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

---
*Stack research for: Mehfil Celebration Planner*  
*Researched: 2026-10-27*
