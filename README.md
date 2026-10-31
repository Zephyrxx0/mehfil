# Mehfil (महफ़िल)

Planning for milestone celebrations (weddings, milestone birthdays, community gatherings) where the budget, the timeline, vendor quotes and ideas are one linked plan.

> **Words from models, numbers from code.** Every rupee and every date comes from pure TypeScript. Language models only describe and classify. They never produce an amount or a schedule.

## What it does

- **Linked plan.** Change the guest count, a date or a vendor quote and the whole plan rebalances. Each change comes with a plain-language explanation and a one-click undo. Every save is an immutable version.
- **Exact money.** All amounts are integer paise. Shares are split with the largest-remainder method, so line items always add up to the budget to the paisa.
- **Protected Moments.** Mark the thing that matters most (a grandmother's catering, a signature mandap). Its budget floor is never trimmed to pay for something else.
- **Quote check.** Paste a vendor message or upload a screenshot (PNG, JPEG or WebP). The extraction runs in a quarantined sandbox, and every number must be backed by a verbatim quote from the source before it can touch the plan.
- **Style DNA.** Pick visual references from a gallery of 24 swatches and the app turns them into a bounded budget adjustment (a new version), which you can retune or reset.
- **Two links.** A private organizer edit link (works across devices, no login) and a read-only family link that shows category splits and ceremonies, never vendor prices or contacts.

## How the AI is used

Every model call goes through one three-tier ladder (`src/lib/ai/ladder.ts`):

| Tier | Engine                                      | When                                                 |
| ---- | ------------------------------------------- | ---------------------------------------------------- |
| 1    | Gemma (`gemma-4-31b-it`)                    | First choice, 8 s timeout, one repair                |
| 2    | Gemini Flash Lite (`gemini-3.5-flash-lite`) | If tier 1 fails                                      |
| 3    | Deterministic code                          | No API key, daily cap reached, or both models failed |

The app is fully usable at tier 3, so an API key is optional. A run record says which tier answered. When a model fails, the reason shown is a stable code such as `tier_1_failed:model_timeout`; the raw error stays in the server log.

## Getting started

Requires Node 20.9 or newer and [pnpm](https://pnpm.io) (`corepack enable pnpm`).

```bash
git clone https://github.com/Zephyrxx0/mehfil.git
cd mehfil
pnpm install
cp .env.example .env.local   # optional, see below
pnpm dev                     # http://localhost:3000
```

With no configuration, plans are kept in the browser and the deterministic engine does all the work. Two things are optional:

| Variable                                                       | Enables                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY`                                 | Tier 1 and 2 models (`GEMINI_API_KEY` also works)                                                       |
| `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud save, cross-device edit links and family share links                                              |
| `NEXT_PUBLIC_APP_URL`                                          | Public address of this deployment (default `https://bookmymehfil.vercel.app`)                           |
| `SUPABASE_SERVICE_ROLE_KEY`                                    | Server-only. Makes the rate limits and the daily model cap one shared count across all server instances |
| `MODEL_DAILY_CAP`                                              | Daily ceiling on model calls per server instance (default 300)                                          |
| `LOG_LEVEL`                                                    | `debug`, `info`, `warn`, `error` or `silent` (default `info`)                                           |

### Cloud setup (optional)

Apply every file in `supabase/migrations/` to your project, in order (`supabase db push`):

1. `20261027000000_create_collaboration_schema.sql`: tables for events, immutable versions and an audit log.
2. `20261030000000_allow_shared_plan_read.sql`: the first family-link function (replaced by 3).
3. `20261031000000_token_checked_access.sql`: closes the tables to the browser and adds the token-checked functions the app uses.
4. `20261031120000_shared_limits.sql`: the shared rate-limit and model-cap counters (service role only) and a circuit breaker on plan creation.
5. `20261031130000_advisor_fixes.sql`: removes leftover owner policies, the signed-in role's grants on the browser functions, and two redundant indexes.

`supabase/seed.sql` adds a sample event with published tokens. **Never run it against a production database.**

## Deploying

The production address is <https://bookmymehfil.vercel.app>. The app is a standard Next.js app with no custom Vercel configuration. Vercel detects it, and Node 20.9 or newer and pnpm 12 come from `package.json`.

Before the first deployment:

1. **Database.** Apply the five migrations in `supabase/migrations/` in order, then check that the public key cannot call `consume_rate_limit` or `consume_model_call`.
2. **Environment variables.** In Vercel, set these for Production, and for Preview if previews should use the cloud:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are inlined into the browser bundle at build time. Redeploy after changing them.
   - `SUPABASE_SERVICE_ROLE_KEY` is runtime only. Mark it **Sensitive** in Vercel, and never give it a `NEXT_PUBLIC_` prefix.
   - `GOOGLE_GENERATIVE_AI_API_KEY`, `MODEL_DAILY_CAP` and `LOG_LEVEL` are optional, runtime only.
   - Leave `NEXT_PUBLIC_APP_URL` unset for production.
3. **Spend limit.** Set a budget alert and a quota in the Google AI console. `MODEL_DAILY_CAP` is a ceiling per deployment, not a billing limit.
4. **Check after deploying.** `/llms.txt`, `/robots.txt` and `/sitemap.xml` should load. Create a plan, then open its edit link and its family link in another browser. `pnpm test:e2e:live` runs the same flows against the project in `.env.local`, and it writes real plans into that project.

## Scripts

| Command              | Does                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`           | Development server                                                             |
| `pnpm build`         | Production build (needs no network: fonts are self-hosted)                     |
| `pnpm lint`          | ESLint (Next, TypeScript, React hooks, jsx-a11y). `any` is an error            |
| `pnpm typecheck`     | `tsc --noEmit`, strict                                                         |
| `pnpm format:check`  | Prettier                                                                       |
| `pnpm test`          | Unit, component, property, accessibility and SQL tests                         |
| `pnpm test:coverage` | The same with a coverage floor that CI enforces                                |
| `pnpm test:e2e`      | Playwright against a production build and a local database                     |
| `pnpm test:e2e:live` | The same flows against the Supabase project in `.env.local` (writes real rows) |
| `pnpm analyze`       | Build with the bundle analyzer                                                 |
| `pnpm deadcode`      | [fallow](https://fallow.tools) dead-code check                                 |

CI (`.github/workflows/ci.yml`) runs the audit, format, lint, typecheck, tests with coverage, build, and the end-to-end suite.

## Testing

About 600 tests across several layers, because each catches something the others cannot:

- **Engine and components** (Vitest, Testing Library): budget, timeline, diff, quote guard, hooks and screens.
- **Property-based** (`tests/properties`, [fast-check](https://fast-check.dev)): for generated plans, totals add up exactly, protected lines are never lowered, flexible lines stay above their 40% floor, and retracting an idea restores every line. Failures shrink to a minimal case and print a seed. Run `FC_RUNS=20000 pnpm test tests/properties` for a deeper search.
- **SQL** (`tests/db`, [PGlite](https://pglite.dev)): the real migrations run in an in-process Postgres and are exercised as the `anon` role the browser uses. Covered: table lockdown, token handling, version conflicts, immutability, link revocation, function grants. TypeScript tests use the same database.
- **Accessibility** (`tests/a11y`, axe): every main screen and dialog, plus a check that Hindi text declares `lang="hi"`. Colour contrast is checked separately against the real design tokens (`tests/design/contrast.test.ts`), because it needs real layout.
- **End to end** (`e2e`, Playwright): a plan created on one device is opened, edited and shared from others in separate browser contexts, against a local database with the real migrations. It also checks the CSP, the security headers, and that the app contacts nothing but itself.

Coverage is about 90% of statements. `pnpm test:e2e` uses a Playwright browser; set `PLAYWRIGHT_CHROMIUM=/path/to/chromium` to use one you already have.

## Security model

- **No hash is a credential.** The browser holds the plain edit key and share token. The database stores only SHA-256 hashes and compares them itself, inside `SECURITY DEFINER` functions. The tables are closed to the `anon` role (row-level security with no policies, and privileges revoked). See [ADR-0010](docs/adr/0010-token-checked-rpc-persistence.md).
- **256-bit tokens, generated in the database,** returned once. Replacing the family link revokes the old one immediately. Unknown plans and wrong keys get the same answer.
- **Prompt quarantine.** Vendor text and the user's "protected moment" sentence are wrapped in a tag with a random per-request suffix, so a quote cannot close its own data block. Validation text is never fed back into a repair prompt. Models get no tools, and the Numeric Guard rejects any figure without a verbatim anchor.
- **Strict CSP.** `src/middleware.ts` sets a per-request nonce policy: no `unsafe-eval` or `unsafe-inline` for scripts in production, images only from this site, and the browser may contact only the configured Supabase project. HSTS, framing and MIME-sniffing protections are set too.
- **Abuse limits.** Rate limiting trusts only platform-set client-address headers (a forged `x-vercel-ip` buys nothing). A daily cap on model calls drops to the deterministic tier. With `SUPABASE_SERVICE_ROLE_KEY` set, both counters are shared through Postgres (see [ADR-0011](docs/adr/0011-shared-abuse-limits.md)), and `create_event` throttles itself. Request bodies and uploaded images are size-limited, and images are checked by type and by their first bytes.
- **Fail closed.** The claim route returns 503 in production if no database is configured. Error text from models and storage is logged on the server, not returned.

Known limits: without `SUPABASE_SERVICE_ROLE_KEY`, rate-limit and model-cap counters are per server instance, so on serverless hosting the effective ceiling is multiplied by the number of warm instances. A key kept in `localStorage` can be read by script running in the page (the CSP is the mitigation). `create_event` is open to anyone holding the public key; it is size-limited and capped at 300 plans per 10 minutes across everyone, which bounds storage growth but cannot tell one caller from another. These and the trade-offs are written up in ADR-0010 and ADR-0011.

## Accessibility and design

The palette is three hues with plum ink: Warm Ivory `#FFF8EE`, Royal Plum `#3A2442`, Marigold `#F7C873`, Gulabi Rose `#F2A7B8`. Marigold and rose are pastels, so they are fills and decorative icons only, never text. Contrast is measured, not assumed:

| Pair                         | Ratio         |
| ---------------------------- | ------------- |
| Plum on ivory                | 13.2:1        |
| Plum on marigold / on rose   | 8.9:1 / 7.2:1 |
| Secondary text (plum at 70%) | 5.2:1         |
| Terracotta warnings on ivory | 5.4:1         |

Ink on ivory and on the pastel fills reaches AAA. Secondary text and warnings meet AA. Animations honour `prefers-reduced-motion`, and Hindi text is marked `lang="hi"`.

## Project structure

```text
src/
  app/                  Next.js App Router pages and API routes
    api/                ai/quote-analyst, style-dna, vibes/suggest, plan/[id]/claim
    new/  plan/[id]/  share/[token]/
    fonts/              Self-hosted fonts and their licence notice
  components/           brand, hero, intake wizard, workspace (+ hooks/), quotes, ui (shadcn)
  lib/
    engine/             Pure TypeScript: budget, timeline, diff, quote guard, sanitisation
    ai/                 The ladder, prompts, quarantine, heuristics, schemas
    security/           CSP, rate limit, model budget, request and image checks
    storage/            Cloud (database functions), local, and the hybrid adapter
    supabase/           Config and a small fetch client for the database functions
supabase/migrations/    Schema and the token-checked functions
tests/  e2e/            Unit and integration tests; Playwright
docs/adr/               Eleven architecture decision records
```

`.planning/` and `.agents/` are the spec-driven workflow's own files (roadmap, requirements, phase plans and agent instructions). They are kept in the repository to show how the project was planned and are not used at runtime.

## Performance

Fonts are self-hosted, so a build needs no network and the app contacts only its own origin and the configured database. The browser talks to the database through a 70-line fetch client instead of the Supabase SDK, which took about 70 KB off the workspace page's first load (348 KB to 279 KB). Run `pnpm analyze` for the treemaps.

## Known gaps

- The Ewert display font (`src/app/Ewert.ttf`) has no licence file in this repository.
- No `LICENSE` file has been added yet.
