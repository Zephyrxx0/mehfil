import type { RpcClient } from '@/lib/storage/cloud-plans'
import type { SupabaseConfig } from './config'

const DEFAULT_TIMEOUT_MS = 10_000

export interface RpcClientOptions {
  timeoutMs?: number
  /** Injected in tests. Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
}

interface PostgrestErrorBody {
  message?: string
  code?: string
  details?: string
  hint?: string
}

/**
 * A minimal client for the one thing Mehfil asks of Supabase: calling database functions over
 * HTTP (`POST /rest/v1/rpc/<name>`, exactly what PostgREST serves).
 *
 * The app has no user accounts and never uses Supabase Auth, Storage or Realtime, so the full
 * SDK would only add ~230 KB of JavaScript and a session store nobody reads. Access control
 * lives in the database functions (ADR-0010), not in this client.
 */
export function createRpcClient(
  config: SupabaseConfig,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }: RpcClientOptions = {}
): RpcClient {
  const base = config.url.replace(/\/+$/, '')

  return {
    async rpc(fn, args) {
      try {
        const response = await fetchImpl(`${base}/rest/v1/rpc/${fn}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
          },
          body: JSON.stringify(args ?? {}),
          signal: AbortSignal.timeout(timeoutMs),
          cache: 'no-store',
        })

        const text = await response.text()
        const body: unknown = text ? safeJson(text) : null

        if (!response.ok) {
          const failure = (body ?? {}) as PostgrestErrorBody
          return { data: null, error: { message: failure.message ?? `HTTP ${response.status}` } }
        }
        return { data: body, error: null }
      } catch (err) {
        // Network down, timeout, or a blocked request: report it like any other failure.
        const reason = err instanceof Error ? err.message : String(err)
        return { data: null, error: { message: reason } }
      }
    },
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
