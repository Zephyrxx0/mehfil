import type { RpcClient } from '@/lib/storage/cloud-plans'
import { readSupabaseConfig } from './config'
import { createRpcClient } from './rpc-client'

/**
 * The server's connection to the database functions, or null when Supabase is not configured.
 * It uses the same public key as the browser, so a leaked server log or route cannot do more
 * than the browser can: every function checks the capability token itself.
 */
export function getServerRpc(): RpcClient | null {
  const config = readSupabaseConfig()
  return config ? createRpcClient({ url: config.url, apiKey: config.anonKey }) : null
}

/** Counter calls must fail fast: a slow database should not slow down every request. */
const SERVICE_TIMEOUT_MS = 1500
const PLACEHOLDER = /your-|changeme|example/i

/**
 * A connection that uses the SERVER-ONLY service key, for the abuse-limit counters, or null when
 * the key is not set. The service key bypasses row-level security, so it is read from a variable
 * that is never prefixed `NEXT_PUBLIC_` (Next.js would otherwise ship it to the browser) and is
 * used only for the two functions that are granted to the service role alone (ADR-0011).
 */
export function getServiceRpc(): RpcClient | null {
  const config = readSupabaseConfig()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!config || !key || PLACEHOLDER.test(key)) return null

  // One client per set of credentials, so callers can keep state (such as a cool-down) on it.
  if (serviceClient?.url !== config.url || serviceClient.key !== key) {
    serviceClient = {
      url: config.url,
      key,
      client: createRpcClient({ url: config.url, apiKey: key }, { timeoutMs: SERVICE_TIMEOUT_MS }),
    }
  }
  return serviceClient.client
}

let serviceClient: { url: string; key: string; client: RpcClient } | null = null
