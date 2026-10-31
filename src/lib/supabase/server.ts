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
  return config ? createRpcClient(config) : null
}
