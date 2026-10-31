import type { RpcClient } from '@/lib/storage/cloud-plans'

/** Where to send calls and which key to present. Not tied to the public anon key. */
export interface RpcCredentials {
  url: string
  apiKey: string
}

const DEFAULT_TIMEOUT_MS = 10_000

export interface RpcClientOptions {
  timeoutMs?: number
  /** Injected in tests. Defaults to the global `fetch`, looked up at call time. */
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
  credentials: RpcCredentials,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl }: RpcClientOptions = {}
): RpcClient {
  const base = credentials.url.replace(/\/+$/, '')

  return {
    async rpc(fn, args) {
      try {
        // Looked up now, not when the client was built, so a replaced global fetch is honoured.
        const doFetch = fetchImpl ?? fetch
        const response = await doFetch(`${base}/rest/v1/rpc/${fn}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: credentials.apiKey,
            Authorization: `Bearer ${credentials.apiKey}`,
          },
          body: JSON.stringify(args ?? {}),
          signal: AbortSignal.timeout(timeoutMs),
          cache: 'no-store',
        })

        const text = await response.text()
        const body: unknown = text ? safeJson(text) : null

        if (!response.ok) {
          const failure = (body ?? {}) as PostgrestErrorBody
          return {
            data: null,
            error: { message: failure.message ?? `HTTP ${response.status}`, code: failure.code },
          }
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
