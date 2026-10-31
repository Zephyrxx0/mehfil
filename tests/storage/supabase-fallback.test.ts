import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getRpcClient } from '@/lib/supabase/client'
import { getServerRpc } from '@/lib/supabase/server'

describe('without Supabase settings the app runs in local mode', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  afterEach(() => {
    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  })

  it('returns no client on the browser or the server, and does not throw', () => {
    expect(getRpcClient()).toBeNull()
    expect(getServerRpc()).toBeNull()
  })
})
