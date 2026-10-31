import { defineConfig, devices } from '@playwright/test'

const APP_PORT = 3940
const SUPABASE_PORT = 54329
const SUPABASE_URL = `http://localhost:${SUPABASE_PORT}`

/**
 * End-to-end tests run the production build against a local database that applies the real
 * migrations (see e2e/support/local-supabase.mjs). Set PLAYWRIGHT_CHROMIUM to use a system
 * browser instead of downloading one.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/support/local-supabase.mjs',
      url: `${SUPABASE_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { LOCAL_SUPABASE_PORT: String(SUPABASE_PORT) },
    },
    {
      // The public Supabase settings are inlined at build time, so build with them set.
      command: `pnpm build && pnpm start -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-e2e-anon-key-not-a-secret',
        GOOGLE_GENERATIVE_AI_API_KEY: '',
      },
    },
  ],
})
