# Security Policy

## Supported versions

Mehfil is pre-1.0 (`package.json` version 0.1.0). Only the latest commit on `main` is supported. Fixes are not backported.

## Reporting a vulnerability

Please report vulnerabilities privately. Open the repository's **Security** tab and choose **Report a vulnerability** (GitHub private vulnerability reporting). Do not open a public issue or pull request for a suspected vulnerability.

Include what you found, the steps to reproduce it, and the impact you expect. Test only against your own local or self-hosted instance, never against someone else's plan.

**Response goal:** we aim to acknowledge a report within 7 days. This is a goal, not a guarantee. Mehfil is maintained by volunteers.

## Scope

In scope:

- Handling of edit keys and share keys (generation, storage, transport, revocation).
- The database functions in `supabase/migrations`, including access checks, grants and the abuse limits.
- The AI routes under `src/app/api`, in particular the prompt quarantine and the rule that models never produce amounts or dates.
- The Content Security Policy and the other response headers.

Out of scope:

- Reports that need physical access to a device or an already unlocked browser.
- Missing security headers on static files that carry no sensitive data.
- Denial of service by sheer volume of traffic.

## Threat model

| Threat                            | What we do                                                                                                                                                                                                                                                                                            | Tests                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Edit or share key theft           | Keys are 256-bit random values. The database stores only their SHA-256 hashes and checks the key inside each function. A nonce-based CSP (no `unsafe-inline`, no `unsafe-eval`) limits what injected script could read, and the edit key is removed from the address bar after the server accepts it. | `tests/db/token-access.test.ts`, CSP test in `e2e/cloud-sharing.spec.ts`                                          |
| Brute force on keys or links      | Per plan, 20 failed edit-key attempts in 10 minutes lock further attempts on that plan, enforced in the database. Opening a share link is limited to 120 per minute per plan. The claim route is also limited to 10 attempts per minute per client.                                                   | `tests/db/edit-key-limit.test.ts`, `tests/db/share-link-limit.test.ts`, `tests/security/claim-rate-limit.test.ts` |
| Prompt injection into model calls | User text and quotes are wrapped in a per-request random tag, lookalike tags and control characters are stripped, and the model's output is checked against a schema before use. Models never emit numbers or dates; code computes every amount and date.                                             | `tests/security/prompt-quarantine.test.ts`, `tests/security/ai-routes.test.ts`                                    |
| Cross-site scripting (XSS)        | Nonce-based CSP on every page, React escaping, and a closed registry of components instead of model-generated markup.                                                                                                                                                                                 | `tests/security/headers.test.ts`, `tests/security/middleware.test.ts`, CSP test in `e2e/cloud-sharing.spec.ts`    |

## Known trade-offs

These are decisions, not oversights. Reports that only restate them are out of scope, but a way around the stated protection is not.

- **A plan id is not secret.** It appears in the edit link. Anyone who knows it can send 20 wrong keys and make the database refuse every key for that plan for up to 10 minutes. This cannot expose or change a plan. It delays cloud saves, and the app keeps the organizer's latest edit on their device and shows "Sync paused" meanwhile. See [ADR-0010](docs/adr/0010-token-checked-rpc-persistence.md).
- **The family link is a bearer link.** Whoever holds it can see the sanitized family view. Replacing the link revokes the old one at once. One person opening it in a loop can make it look expired to others for the rest of that minute.
- **The `style-src` directive allows `'unsafe-inline'`.** The animation and dialog libraries set inline style attributes, which cannot carry a nonce. Scripts do not allow it.
- **Edit keys live in the browser's `localStorage`.** Script running on the page could read them, which is what the CSP guards against.
