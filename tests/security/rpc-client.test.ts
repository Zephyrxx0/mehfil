import { describe, expect, it, vi } from 'vitest'
import { createRpcClient } from '@/lib/supabase/rpc-client'
import { readSupabaseConfig } from '@/lib/supabase/config'

const CONFIG = { url: 'https://abc.supabase.co/', apiKey: 'anon-key-123' }

function respond(status: number, body: unknown) {
  return vi.fn(
    async () =>
      new Response(body === undefined ? '' : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
  ) as unknown as typeof fetch
}

describe('createRpcClient', () => {
  it('posts named arguments to the function endpoint with the public key', async () => {
    const fetchImpl = respond(200, { ok: true })
    const client = createRpcClient(CONFIG, { fetchImpl })

    const result = await client.rpc('verify_edit_key', { p_event_id: 'e', p_edit_key: 'k' })

    expect(result).toEqual({ data: { ok: true }, error: null })
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://abc.supabase.co/rest/v1/rpc/verify_edit_key') // no double slash
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ p_event_id: 'e', p_edit_key: 'k' })
    const headers = init.headers as Record<string, string>
    expect(headers.apikey).toBe('anon-key-123')
    expect(headers.Authorization).toBe('Bearer anon-key-123')
    expect(init.cache).toBe('no-store')
  })

  it('returns a database error as an error, with the server’s message', async () => {
    const client = createRpcClient(CONFIG, {
      fetchImpl: respond(400, { message: 'invalid plan snapshot', code: '22023' }),
    })
    expect(await client.rpc('create_event', {} as never)).toEqual({
      data: null,
      error: { message: 'invalid plan snapshot', code: '22023' },
    })
  })

  it('survives an error body that is not JSON', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 }))
    const client = createRpcClient(CONFIG, { fetchImpl: fetchImpl as unknown as typeof fetch })
    expect(await client.rpc('verify_edit_key', {} as never)).toEqual({
      data: null,
      error: { message: 'HTTP 502' },
    })
  })

  it('reports a network failure as an error instead of throwing', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const client = createRpcClient(CONFIG, { fetchImpl: fetchImpl as unknown as typeof fetch })
    expect(await client.rpc('verify_edit_key', {} as never)).toEqual({
      data: null,
      error: { message: 'Failed to fetch' },
    })
  })

  it('gives up after the timeout', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'TimeoutError'))
          )
        })
    )
    const client = createRpcClient(CONFIG, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 20,
    })
    const result = await client.rpc('verify_edit_key', {} as never)
    expect(result.data).toBeNull()
    expect(result.error?.message).toMatch(/abort/i)
  })

  it('treats an empty 200 reply as null data (a function that returns nothing)', async () => {
    const client = createRpcClient(CONFIG, { fetchImpl: respond(200, undefined) })
    expect(await client.rpc('regenerate_share_key', {} as never)).toEqual({
      data: null,
      error: null,
    })
  })
})

describe('readSupabaseConfig', () => {
  const original = { ...process.env }
  const restore = () => {
    process.env = { ...original }
  }

  it('returns null when unset, and for the placeholder text from .env.example', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    expect(readSupabaseConfig()).toBeNull()

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project-id.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key-here'
    expect(readSupabaseConfig()).toBeNull()
    restore()
  })

  it('returns the trimmed settings when both are real', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ' https://real.supabase.co '
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ' real-key '
    expect(readSupabaseConfig()).toEqual({ url: 'https://real.supabase.co', anonKey: 'real-key' })
    restore()
  })
})

describe('createRpcClient and the global fetch', () => {
  it('uses whichever fetch is current at call time, not the one from when it was created', async () => {
    const client = createRpcClient({ url: 'https://abc.supabase.co', apiKey: 'k' })

    const replacement = vi.fn(async () => new Response('true', { status: 200 }))
    vi.stubGlobal('fetch', replacement)
    try {
      expect(await client.rpc('verify_edit_key', {} as never)).toEqual({ data: true, error: null })
      expect(replacement).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
