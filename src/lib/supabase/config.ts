export interface SupabaseConfig {
  url: string
  anonKey: string
}

const PLACEHOLDER_MARKERS = ['your-project', 'your-anon-key', 'your-supabase']

/**
 * Reads the public Supabase settings. Returns null when they are missing or still hold the
 * placeholder text from `.env.example`, so the app falls back to local mode instead of
 * creating a client that fails on every call.
 *
 * `process.env.NEXT_PUBLIC_*` must be written out in full here: Next.js inlines them into
 * the browser bundle only when it can see the literal name.
 */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  if (PLACEHOLDER_MARKERS.some((marker) => url.includes(marker) || anonKey.includes(marker))) {
    return null
  }
  return { url, anonKey }
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null
}
