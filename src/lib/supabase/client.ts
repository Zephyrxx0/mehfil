import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { readSupabaseConfig } from './config'

const REQUEST_TIMEOUT_MS = 10_000

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Returns a browser-side Supabase client singleton, or null if credentials are unconfigured.
 * Requests time out so a bad connection falls back to local storage instead of hanging.
 */
export function getClientSupabase() {
  if (clientInstance) return clientInstance

  const config = readSupabaseConfig()
  if (!config) return null

  clientInstance = createBrowserClient<Database>(config.url, config.anonKey, {
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) }),
    },
  })
  return clientInstance
}
