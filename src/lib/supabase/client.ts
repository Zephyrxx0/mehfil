import type { RpcClient } from '@/lib/storage/cloud-plans'
import { readSupabaseConfig } from './config'
import { createRpcClient } from './rpc-client'

let instance: RpcClient | null = null

/** The browser's connection to the database functions, or null when Supabase is not configured. */
export function getRpcClient(): RpcClient | null {
  if (instance) return instance
  const config = readSupabaseConfig()
  if (!config) return null
  instance = createRpcClient({ url: config.url, apiKey: config.anonKey })
  return instance
}
