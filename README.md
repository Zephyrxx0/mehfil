# Mehfil (महफ़िल)

> **Celebration Planning with Mathematical Integrity**  
> An interconnected planning workspace for milestone celebrations (weddings, milestone birthdays, cultural gatherings) where budget, timeline, vendors, and personalized ideas form a single mathematically linked plan.

---

## 🌟 The Core Philosophy

> **"Words from models, numbers from code."**

In traditional planning tools, families struggle between rigid, lifeless spreadsheets and hallucination-prone AI chatbots that invent dates or generate distorted financial sums. 

**Mehfil** guarantees:
1. **Mathematical Consistency**: Pure TypeScript code owns 100% of arithmetic and dates. AI models are structurally restricted to semantic descriptions and visual categorization—never numbers or schedules.
2. **Integer Paise Precision**: All currency calculations use integer paise (`INR`) to eliminate IEEE-754 floating-point rounding errors. Zero-sum rebalancing uses the largest remainder method.
3. **Protected Floors**: Crucial emotional elements (e.g. Grandma's heritage catering or a signature mandap) can be designated as **Protected Moments**, locking their budget floor against automatic displacement.
4. **Three-Tier AI Fallback**:
   - **Tier 1 (Gemma)**: Open-weight structured Style DNA extraction & layout curation.
   - **Tier 2 (Gemini Flash)**: High-speed multimodal quote parsing & vision analysis.
   - **Tier 3 (Pure Code)**: Deterministic heuristic engine ensuring the app runs flawlessly offline or without API keys.

---

## ✨ Features

- **🎭 Interactive Hero Experience**: Cinematic landing page featuring custom animated Ewert slab display typography, interactive Hairline line art that answers the cursor, and festive procedural Rangoli & Fireworks.
- **⚡ Step-by-Step Brief Wizard**: Guided 5-step intake for guest count, dates, city archetypes, budget targets, and protected categories with instant starter archetypes (e.g., North/South Indian weddings, milestone birthdays).
- **📊 Linked Workspace Shell**:
  - **Budget Tab**: Dynamic budget lines with zero-sum sliders, floor protections, and instant visual impact indicators.
  - **Timeline Tab**: Backwards scheduling timeline calculated from the celebration date, including vendor payment milestones and ceremony schedules.
  - **Ideas Tab**: Curated cultural ideas with zero-sum displacement previews before adoption.
  - **Style Tab**: Visual Vibe Gallery with 24 curated festive aesthetic swatches and AI-powered vibe synthesis.
  - **History Tab**: Immutable version history of every change, with plain-language explanations and one-click undo.
- **🧾 Quarantined Quote Analyst**: Upload vendor quotes or contracts (PDF/Image) to extract line items into a sandboxed preview before committing changes to the live plan.
- **🔗 Dual-Link Collaboration**:
  - **Read-Only Family Link** (`/share/[token]`): Sanitized celebratory view that shows overall category splits, schedule milestones, and filtered `.ics` calendar export, while concealing private vendor costs, notes, and organizer contact details.
  - **Capability Key Access**: Organizers claim editing capability via cryptographic secret tokens (`edit_key_hash`) with constant-time verification and automatic rotation.

---

## 🎨 Design Discipline & Palette

Mehfil follows a strict 3-hue festive palette honoring celebratory traditions while ensuring **WCAG AAA (4.5:1+)** contrast compliance:

| Token | Name | Value | Purpose |
|---|---|---|---|
| `--background` | **Warm Ivory** | `hsl(43, 85%, 97%)` | Primary canvas & cards |
| `--foreground` | **Royal Plum** | `hsl(300, 29%, 20%)` | High-contrast ink & typography |
| `--primary` | **Marigold** | `hsl(38, 92%, 50%)` | Festive accents, active buttons |
| `--secondary` | **Gulabi Rose** | `hsl(338, 70%, 55%)` | Celebratory highlights & badges |
| `--maroon` | **Deep Maroon** | `hsl(348, 60%, 25%)` | Distinctive decorative accents |

> **Rule**: Pastels are used exclusively as fills—never as text on light backgrounds.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Dynamic Routes)
- **Language**: [TypeScript 5.6+](https://www.typescriptlang.org/) (Strict mode, exhaustive typing)
- **UI & Components**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Animation & Motion**: [Motion](https://motion.dev/) (Framer Motion), [GSAP](https://gsap.com/)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/) (`@ai-sdk/google`)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 16, Row-Level Security, RPC functions)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: [pnpm](https://pnpm.io/) (`corepack enable pnpm`)

### 1. Clone & Install

```bash
git clone https://github.com/Zephyrxx0/mehfil.git
cd mehfil
pnpm install
```

### 2. Configure Environment Variables

Copy the example file to `.env.local`:

```bash
cp .env.example .env.local
```

Mehfil works **out-of-the-box with zero configuration** using local browser storage and deterministic heuristic algorithms. To enable cloud sync and AI features, provide:

```env
# Google Generative AI / Gemini API (Optional)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup (If using Supabase)

If connecting to a live Supabase project, execute the SQL migrations located in `supabase/migrations/`:
1. `20261027000000_create_collaboration_schema.sql` (Creates events, plan versions, and audit logs)
2. `20261030000000_allow_shared_plan_read.sql` (Enables sanitized public share RPC)

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Mehfil includes a comprehensive suite of 380+ unit, property-based, and security tests:

```bash
# Run the entire test suite
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run TypeScript compiler check
pnpm tsc --noEmit

# Test production build
pnpm build
```

---

## 🛡️ Security Architecture

- **Constant-Time Verification**: All capability tokens and secret keys are hashed (SHA-256) and verified using `crypto.timingSafeEqual` to prevent side-channel timing attacks.
- **Sliding-Window Rate Limiting**: All AI and mutation routes ([`/api/ai/quote-analyst`](file:///home/zeph/Code/mehfil/src/app/api/ai/quote-analyst/route.ts), [`/api/style-dna`](file:///home/zeph/Code/mehfil/src/app/api/style-dna/route.ts), [`/api/vibes/suggest`](file:///home/zeph/Code/mehfil/src/app/api/vibes/suggest/route.ts), [`/api/plan/[id]/claim`](file:///home/zeph/Code/mehfil/src/app/api/plan/[id]/claim/route.ts)) enforce per-IP rate limits with trusted reverse-proxy header normalization (`x-vercel-ip`, `cf-connecting-ip`, `x-real-ip`).
- **Strict Content Security Policy (CSP)**: Hardened headers in `next.config.ts` blocking untrusted scripts, unauthorized frames (`frame-ancestors 'none'`), and dangerous MIME types.
- **Row-Level Security & RPC**: Database tables enforce strict owner-only RLS policies. Anonymous guest links query via a `SECURITY DEFINER` Postgres function that strips sensitive tokens and hashes.

---

## 📁 Project Structure

```text
mehfil/
├── public/                 # Static brand assets, fonts, swatches, hairline figures
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   │   ├── (landing)/      # Home page (Hero, line art, fireworks)
│   │   ├── new/            # Plan creation wizard
│   │   ├── plan/[id]/      # Linked celebration workspace (5 tabs)
│   │   ├── share/[token]/  # Public sanitized family view
│   │   └── api/            # Secured API routes
│   ├── components/         # React UI components
│   │   ├── brand/          # Wordmark & branding primitives
│   │   ├── hero/           # Landing page typography & animation
│   │   ├── intake/         # Wizard steps & starter chips
│   │   ├── workspace/      # Tab panes (Budget, Timeline, Ideas, Style, History)
│   │   └── ui/             # shadcn/ui primitives
│   ├── lib/
│   │   ├── engine/         # Pure TS arithmetic engine, timeline, sanitization
│   │   ├── security/       # Rate limiting, proxy normalization, crypto helpers
│   │   └── supabase/       # Supabase client & server factories
│   └── types/              # Database schemas & domain contracts
├── supabase/migrations/    # PostgreSQL RLS & schema migrations
└── tests/                  # Vitest test suite (engine, components, storage, security)
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
