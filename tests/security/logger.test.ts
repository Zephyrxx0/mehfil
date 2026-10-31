import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLogger, redact } from '@/lib/logger'

describe('logger redaction', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.LOG_LEVEL
  })

  it('redacts sensitive object keys at any depth', () => {
    const out = redact({ ok: 1, editKey: 'abc', nested: { apiToken: 'x', fine: 'y' } })
    expect(out).toEqual({
      ok: 1,
      editKey: '[REDACTED]',
      nested: { apiToken: '[REDACTED]', fine: 'y' },
    })
  })

  it('redacts secrets embedded in strings and error messages', () => {
    const hex = 'a'.repeat(64)
    expect(redact(`open /plan/1?key=${hex}`)).toBe('open /plan/1?key=[REDACTED]')
    expect(redact(`bad key AIza${'x'.repeat(30)}`)).toBe('bad key [REDACTED]')
    expect(redact(new Error(`token ${hex}`))).toEqual({
      name: 'Error',
      message: 'token [REDACTED]',
    })
  })

  it('is silent under the test runner and honours LOG_LEVEL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const log = createLogger('test')
    log.warn('hidden')
    expect(warn).not.toHaveBeenCalled()

    process.env.LOG_LEVEL = 'warn'
    log.warn('shown', { editKey: 'secret' })
    expect(warn).toHaveBeenCalledTimes(1)
    const entry = JSON.parse(warn.mock.calls[0][0] as string)
    expect(entry).toMatchObject({ level: 'warn', scope: 'test', message: 'shown' })
    expect(entry.context.editKey).toBe('[REDACTED]')
  })
})
