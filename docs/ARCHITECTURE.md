# Architecture

Mehfil is a Next.js app that plans a celebration as one linked set of numbers: budget lines, a timeline, vendor quotes and ideas. This page shows how the code is layered, how one request travels through it, and where to look for things. For the reasons behind individual choices, see the [decision records](adr/README.md).

## Layers

```text
+--------------------------------------------------------------------------+
| BROWSER CLIENT                                                           |
|   src/components/*       screens and dialogs                             |
|   use*.ts hooks          edits, version history, saves                   |
|   src/app/**/page.tsx    routes that mount the screens                   |
+--------------------------------------------------------------------------+
                    |  fetch /api/*
                    v
+--------------------------------------------------------------------------+
| NEXT.JS SERVER EDGE                                                      |
|   src/middleware.ts              CSP nonce on page responses             |
|   src/app/api/*/route.ts         rate limit, body size, zod validation   |
|   src/app/share/[token]/page.tsx  family view, rendered on the server    |
+--------------------------------------------------------------------------+
                    |  calls
                    v
+--------------------------------------------------------------------------+
| AI ORCHESTRATOR   src/lib/ai                                             |
|   ladder.ts         three tiers: Gemma, Gemini Flash Lite, plain code    |
|   structured.ts     one model call with a schema, no tools               |
|   quarantine.ts     wraps untrusted text in a per-request tag            |
|   heuristic*.ts     the tier 3 answers, no model involved                |
|   vendor-quote.ts   hands model output to the engine for checking        |
+--------------------------------------------------------------------------+
                    |  model text goes through engine checks
                    v
+--------------------------------------------------------------------------+
| PURE ENGINE   src/lib/engine                                             |
|   currency.ts    money as integer paise                                  |
|   budget/        allocate, rebalance, quotes, ideas, shared              |
|   timeline.ts    dates and tasks                                         |
|   diff.ts        plain-language change explanations                      |
|   quote-guard.ts  verbatim-evidence check on vendor figures              |
+--------------------------------------------------------------------------+
                    |  Plan objects
                    v
+--------------------------------------------------------------------------+
| STORAGE   src/lib/storage                                                |
|   local-plans.ts        this browser's localStorage                      |
|   cloud-plans.ts        typed calls to the database functions            |
|   persistence.ts        hybrid: cloud when possible, local otherwise     |
|   capability-store.ts   edit key and share token, kept in this browser   |
|   (src/lib/supabase/rpc-client.ts: plain fetch, no Supabase SDK)         |
+--------------------------------------------------------------------------+
                    |  POST /rest/v1/rpc/<function>
                    v
+--------------------------------------------------------------------------+
| POSTGRES   supabase/migrations                                           |
|   SECURITY DEFINER functions that check the edit key or share token      |
|   tables closed to the browser's role: RLS on, no policies, no grants    |
|   shared rate limits and daily model cap (service role only)             |
|   per-plan limit on failed edit-key attempts                             |
+--------------------------------------------------------------------------+
```

The picture is a stack, but calls do not always go one layer at a time:

- **The engine runs in the browser too.** Every edit (guest count, adopting an idea, committing a quote) is one engine call made by `usePlanEditor` in `src/components/workspace/hooks/`. The server is not involved.
- **The browser talks to Postgres directly** for plan reads and saves, through `persistence.ts` and `rpc-client.ts`. Only AI calls and the edit-key check go through `src/app/api/`.
- **The server reads Postgres in two places:** the claim route (`src/app/api/plan/[id]/claim/route.ts`) and the family page (`src/app/share/[token]/page.tsx`).
- **The server uses the engine** after a model answers. `buildVendorQuote` in `src/lib/ai/vendor-quote.ts` calls the engine's quote guard to check and total every figure.
- **Middleware covers pages only.** The matcher in `src/middleware.ts` skips `/api` and static files. Other security headers come from `next.config.ts`.

## The rule that shapes everything

**Models write words. Code writes numbers and dates.**

- Every amount is an integer number of paise (`Paise` in `src/lib/engine/types.ts`). Plan amounts are whole integers, so they cannot pick up floating-point drift.
- Splitting a total across lines uses the largest-remainder method (`apportionRupees` in `src/lib/engine/budget/allocate.ts`), so the lines add up to the total exactly.
- Dates and the timeline come from `src/lib/engine/timeline.ts`.
- Models only describe and classify. The Style analyst returns a score for each style dimension, a palette and a sentence. The Quote analyst returns text it found in a vendor message. The engine then turns style scores into a bounded budget change (`src/lib/engine/style.ts`) and checks each quoted figure against the source text (`src/lib/engine/quote-guard.ts`).
- Model calls have no tools. `generateStructured` in `src/lib/ai/structured.ts` never passes `tools`, and `tests/ai/structured.test.ts` checks that.
- If no model is available, a deterministic function in the same module answers instead, so the app works with no API key. The ladder (`src/lib/ai/ladder.ts`) tries Gemma, then Gemini Flash Lite, then that deterministic function, and it never throws.

## Request flow for a vendor quote

A user pastes a WhatsApp message or uploads a screenshot into the quote sheet.

1. **Browser.** `useQuoteExtraction` (`src/components/quotes/`) shrinks an uploaded image with `prepareQuoteImage` (`src/lib/client/image-resize.ts`) and sends `POST /api/ai/quote-analyst` with the text, the image, the budget category and the guest count.
2. **Route handler** (`src/app/api/ai/quote-analyst/route.ts`). It applies a rate limit of 15 requests a minute per client, reads the body with a size cap (`src/lib/security/request.ts`), and checks the shape with zod. An image must be PNG, JPEG or WebP, under 3 MB, with matching first bytes (`src/lib/security/image-upload.ts`).
3. **Orchestrator** (`src/lib/ai/quote-pipeline.ts`). The quote text is wrapped in a tag with a random suffix (`fenceUntrustedText` in `quarantine.ts`), so the quote cannot close its own data block. `runLadder` then:
   - skips the models if there is no API key or the daily model cap is used up (`src/lib/security/model-budget.ts`);
   - otherwise tries tier 1 (8 second timeout, one repair attempt with fixed wording), then tier 2;
   - falls back to `extractDeterministicQuote` (`quote-heuristic.ts`), which uses pattern matching and no model.
4. **Engine on the result.** `buildVendorQuote` (`vendor-quote.ts`) calls `buildPackageTiers` in `src/lib/engine/quote-guard.ts`. Each line item must carry a `sourceAnchor` that appears verbatim in the quote. Items that fail go into `droppedItems`. Totals and per-guest scaling are computed here. `detectQuoteOmissions` flags usual costs the quote leaves out, such as GST.
5. **Response.** The route returns `{ vendorQuote, runRecord }`. The run record says which tier answered and, if it was not tier 1, a stable reason code. If anything unexpected throws, the route rebuilds the quote with the deterministic extractor.
6. **Back in the browser.** The Quote Check card shows the tiers and omissions. `previewQuoteDisplacement` (`src/lib/engine/budget/quotes.ts`, called from `useQuoteCheckState.ts`) shows which budget lines would give up money. When the user confirms, `usePlanEditor` calls `commitQuote`, and `usePlanVersions` saves the new plan version.

## How a plan is saved and shared

A plan has two secrets, and the database generates both.

|             | Edit key                                       | Share key                                   |
| ----------- | ---------------------------------------------- | ------------------------------------------- |
| Who gets it | The organizer                                  | Family members the organizer sends it to    |
| Access      | Read and write                                 | Read-only, reduced view                     |
| Link        | `/plan/<id>?key=<edit key>`                    | `/share/<share key>`                        |
| Checked by  | `verify_edit_key` and the other edit functions | `get_shared_plan`                           |
| Revoked by  | Not replaceable in the app                     | `regenerate_share_key` (needs the edit key) |

**Creating a plan.** `NewPlanClient` builds the first version in the browser with `instantiatePlanFromBrief` (`src/lib/engine/archetypes.ts`), then calls `saveNewPlan`. If Supabase is configured, `create_event` makes the event id and both keys with `gen_random_bytes(32)`, stores only their SHA-256 hashes, and returns the plain keys once. The browser keeps them in `localStorage` (`capability-store.ts`) because the database cannot show them again. If Supabase is not configured, or the call fails, the plan stays in `localStorage` only (`local-plans.ts`) and still works. A "too many new plans" answer from the database (code `53400`) is treated the same way.

**Saving.** Edits are debounced for 800 ms (`COMMIT_DEBOUNCE_MS` in `usePlanVersions.ts`) and saved one at a time. `HybridPersistenceAdapter.savePlan` calls `save_plan_version` with the edit key and the parent version id. In Postgres, the function locks the event row, and if the parent is no longer the newest version it returns `conflict` along with the newest snapshot instead of saving. Each save adds a row to `plan_versions`, which also stores the full plan as a JSON `snapshot`. Triggers reject updates to `plan_versions` and `change_records`, so history is append-only. Undo and restore create a new version that copies an old one.

**Opening on another device.** The edit link carries the key. `PlanClientPage` posts it to `/api/plan/[id]/claim`, which asks the database to verify it, behind a rate limit of 10 attempts a minute. If the database accepts it, the browser stores the key and removes it from the address bar. There is no session cookie. The database checks the key again on every call.

**Wrong keys.** Every edit-key function goes through `mehfil_edit_key_matches`. A wrong key, an unknown plan and an archived plan all give the same answer. After 20 failed attempts on one plan within 10 minutes, the database refuses all attempts on that plan, including the right key, until the failures age out (`supabase/migrations/20261031140000_edit_key_failure_limit.sql`). This runs inside Postgres because the public key lets anyone call the functions without going through the route.

Because a plan id is not secret (it is in the edit link), anyone who knows it can trigger that lockout. The app is built so that costs the organizer a delay and nothing else. A save the database refuses keeps the latest edit on the device (`HybridPersistenceAdapter.savePlan` writes the plan locally and returns `edit_key_rejected`), and the status badge reads "Sync paused" instead of "Saved Locally". The browser that created the plan keeps its edit key. After a reload during the lockout, `getPlan` returns the device copy with `cloudUnconfirmed`, and the badge starts as "Sync paused". The next change after the failures age out saves to the cloud again. A device that only has a pasted link forgets a refused key, so its owner pastes the link again.

**Family view.** `src/app/share/[token]/page.tsx` runs on the server. It calls `get_shared_plan`, which hashes the token itself and returns the event summary and the latest budget lines. `sanitizePlanForSharing` (`src/lib/engine/sanitization.ts`) then reduces that to category shares and ceremonies, without vendor quotes. An unknown or replaced token shows an "expired" page. A family link can be opened 120 times a minute per plan (`supabase/migrations/20261031150000_share_link_open_limit.sql`). Only a token that matches a real plan is counted, so random guesses cost no database write and cannot use up another family's allowance. Over the limit, the answer is the same "expired" page. The family view leaves out the contingency line, so its categories add up to less than the total budget; their percentages are apportioned to sum to exactly 100.

**Closed tables.** `events`, `plan_versions` and `change_records` have row-level security on, no policies, and privileges revoked from `anon` and `authenticated`. The browser can only call the functions. See [ADR-0010](adr/0010-token-checked-rpc-persistence.md).

## Where to find things

| Concern                                              | Path                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Money type and rupee formatting                      | `src/lib/engine/types.ts` (`Paise`), `src/lib/engine/currency.ts`                                                                   |
| Splitting a total exactly                            | `src/lib/engine/budget/allocate.ts`                                                                                                 |
| Guest-count rebalance, trim remedy, protected moment | `src/lib/engine/budget/rebalance.ts`                                                                                                |
| Adopting and retracting ideas                        | `src/lib/engine/budget/ideas.ts`                                                                                                    |
| Quote preview and commit                             | `src/lib/engine/budget/quotes.ts`                                                                                                   |
| Floors, donor lines, shortfall remedies              | `src/lib/engine/budget/shared.ts`                                                                                                   |
| Plan templates                                       | `src/lib/engine/archetypes.ts`                                                                                                      |
| Timeline, calendar export                            | `src/lib/engine/timeline.ts`, `src/lib/engine/ics.ts`                                                                               |
| Plain-language change explanations                   | `src/lib/engine/diff.ts`                                                                                                            |
| Style DNA to budget change                           | `src/lib/engine/style.ts`                                                                                                           |
| Quote figure checks and omissions                    | `src/lib/engine/quote-guard.ts`, `src/lib/engine/omission-rules.ts`                                                                 |
| Family-safe projection                               | `src/lib/engine/sanitization.ts`                                                                                                    |
| Model ladder and run records                         | `src/lib/ai/ladder.ts`, `src/lib/ai/run-record.ts`, `src/lib/ai/errors.ts`                                                          |
| One structured model call                            | `src/lib/ai/structured.ts`                                                                                                          |
| Prompt quarantine                                    | `src/lib/ai/quarantine.ts`                                                                                                          |
| Model output schemas                                 | `src/lib/ai/schemas.ts`                                                                                                             |
| Agents                                               | `style-dna.ts`, `style-analyst.ts`, `quote-pipeline.ts`, `quote-analyst.ts`, `vibe-suggest.ts`, `layout-ladder.ts` in `src/lib/ai/` |
| Code that answers when no model can                  | `src/lib/ai/heuristic.ts`, `quote-heuristic.ts`, `layout-heuristic.ts`                                                              |
| API routes                                           | `src/app/api/ai/quote-analyst`, `src/app/api/style-dna`, `src/app/api/vibes/suggest`, `src/app/api/plan/[id]/claim`                 |
| CSP nonce and security headers                       | `src/middleware.ts`, `src/lib/security/csp.ts`, `next.config.ts`                                                                    |
| Rate limits and daily model cap                      | `src/lib/security/rate-limit.ts`, `memory-limits.ts`, `shared-limits.ts`, `model-budget.ts`                                         |
| Request body and image checks                        | `src/lib/security/request.ts`, `src/lib/security/image-upload.ts`                                                                   |
| Plan storage                                         | `src/lib/storage/` (`persistence.ts` chooses between local and cloud)                                                               |
| Database client                                      | `src/lib/supabase/` (`rpc-client.ts`, `client.ts` for the browser, `server.ts` for the server)                                      |
| Database schema and functions                        | `supabase/migrations/`, sample data in `supabase/seed.sql`                                                                          |
| Types for the database functions                     | `src/types/database.ts`                                                                                                             |
| Plan editing and version hooks                       | `src/components/workspace/hooks/`                                                                                                   |
| Quote screens                                        | `src/components/quotes/`                                                                                                            |
| Intake wizard                                        | `src/components/intake/`                                                                                                            |
| Curated content                                      | `src/data/swatches.ts`, `src/data/curated-ideas.ts`, `src/data/sample-quotes.ts`                                                    |
| Decisions and their reasons                          | `docs/adr/` (index in [adr/README.md](adr/README.md))                                                                               |

## Tests

`vitest` runs everything under `tests/` (`vitest.config.ts`), using `happy-dom` for component tests. The directories under `tests/` follow the code:

| Path                                                | What it covers                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `tests/engine/`                                     | Budget, timeline, diff, quote guard, currency, sanitization                                                       |
| `tests/ai/`                                         | The ladder, the structured helper, the quote and style analysts, with fake models                                 |
| `tests/security/`                                   | Routes, middleware and headers, rate limits, image checks, prompt quarantine, the RPC client                      |
| `tests/storage/`                                    | Local and cloud persistence                                                                                       |
| `tests/components/`, `tests/a11y/`, `tests/design/` | Screens, axe accessibility checks, colour tokens and contrast                                                     |
| `tests/data/`, `tests/config/`                      | Curated ideas, site configuration                                                                                 |
| `tests/properties/`                                 | Property tests with `fast-check` for the money engine. `FC_RUNS` sets the number of generated cases (default 300) |
| `tests/db/`                                         | The real SQL, run on PGlite (below)                                                                               |
| `tests/helpers/`, `tests/e2e-support/`              | `pglite.ts`, and a test for the local stand-in server that `e2e/` uses                                            |

**`tests/db` and PGlite.** `tests/helpers/pglite.ts` starts an in-process Postgres ([PGlite](https://pglite.dev)), creates the `anon`, `authenticated` and `service_role` roles, and applies every file in `supabase/migrations/` in name order. Tests then call the functions as `anon`, as the browser would. They cover table lockdown, token handling, version conflicts, immutability, shared limits and the edit-key failure limit. Some TypeScript tests run against the same database: `tests/storage/cloud-persistence.test.ts`, `tests/security/share-rpc.test.tsx` and `tests/security/shared-limits.test.ts`.

**`e2e/`.** Playwright (`playwright.config.ts`) builds the app, starts `e2e/support/local-supabase.mjs` (a small HTTP server that serves `/rest/v1/rpc/<function>` on top of PGlite with the real migrations), and drives Chromium. `e2e/cloud-sharing.spec.ts` creates a plan in one browser context and opens, edits and shares it from others. It also checks the CSP, the security headers and that the app contacts only itself.

**`e2e-live/`** holds one spec, run with `pnpm test:e2e:live`, against the Supabase project in `.env.local`. It writes real rows.

## Local setup in three commands

Requires Node 20.9 or newer and pnpm.

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm test    # vitest run
```

With no environment variables, plans stay in the browser and the deterministic engine does all the work. `.env.example` lists the optional variables for models and for the cloud.
