import { defineConfig, devices } from '@playwright/test'

/**
 * The same browser flows as playwright.config.ts, run against the REAL Supabase project named in
 * the environment (source .env.local first). It creates real rows, so run it only against a
 * project you can afford to write test plans into. Model calls stay off (key blanked).
 *
 *   set -a; . ./.env.local; set +a; pnpm exec playwright test -c playwright.live.config.ts
 */
const APP_PORT = 3962
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anon || !service)
  throw new Error('Source .env.local: Supabase URL, anon and service keys are required')

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
