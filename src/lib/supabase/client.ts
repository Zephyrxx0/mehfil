import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Returns a browser-side Supabase client singleton, or null if credentials are unconfigured.
 */
export function getClientSupabase() {
  if (clientInstance) return clientInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  clientInstance = createBrowserClient<Database>(url, key)
  return clientInstance
}
