import { defineConfig, devices } from '@playwright/test'

import { existsSync } from 'node:fs'

/**
 * The same browser flows as playwright.config.ts, run against the REAL Supabase project named in
 * .env.local (or already in the environment). It creates real rows, so run it only against a
 * project you can afford to write test plans into. Model calls stay off (key blanked).
 *
 *   pnpm test:e2e:live
 */
const APP_PORT = 3962

// `pnpm test:e2e:live` does not source .env.local, so read it here. Variables already in the
// environment win. process.loadEnvFile needs Node 20.12+; older Node can source the file by hand:
//   set -a; . ./.env.local; set +a; pnpm exec playwright test -c playwright.live.config.ts
if (existsSync('.env.local') && typeof process.loadEnvFile === 'function') {
  const before = { ...process.env }
  process.loadEnvFile('.env.local')
  for (const [key, value] of Object.entries(before)) process.env[key] = value
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anon || !service)
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are ' +
      'required: put them in .env.local or export them before running.'
  )

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/cloud-sharing.spec.ts', 'e2e-live/*.spec.ts'],
  // Tests that hardcode the local stand-in's address or its debug endpoint cannot run here;
  // e2e-live/ covers the same properties against the real project.
  grep: /cloud save and sharing|timeline shows|hardening headers|refuses oversized|live project/,
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm build && pnpm start -p ${APP_PORT}`,
    url: `http://localhost:${APP_PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
      SUPABASE_SERVICE_ROLE_KEY: service,
      GOOGLE_GENERATIVE_AI_API_KEY: '',
      GEMINI_API_KEY: '',
    },
  },
})
