import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { readSupabaseConfig } from './config'

/**
 * Creates a server-side Supabase client for Next.js 15 Server Components and Route Handlers.
 * Asynchronously awaits Next.js 15 cookies() store.
 */
export async function getServerSupabase() {
  const config = readSupabaseConfig()
  if (!config) return null

  let cookieStore: Awaited<ReturnType<typeof cookies>>
  try {
    cookieStore = await cookies()
  } catch {
    // If invoked outside a Next.js request scope (e.g. build or unit test), return null safely
    return null
  }

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Can be safely ignored if invoked from a Server Component where cookies cannot be mutated
        }
      },
    },
  })
}
