import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateText, NoObjectGeneratedError, type LanguageModel } from 'ai'
import { z } from 'zod'
import {
  generateStructured,
  generateStructuredWithRepair,
  isTimeoutOrAbortError,
} from '@/lib/ai/structured'

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  generateText: vi.fn(),
}))

const mockGenerateText = vi.mocked(generateText)
const model = { modelId: 'fake' } as unknown as LanguageModel
const Schema = z.object({ title: z.string(), count: z.number().int() })
const FORBIDDEN_TOOL_KEYS = ['tools', 'toolChoice', 'activeTools']

const callArgs = (index: number) => mockGenerateText.mock.calls[index][0] as Record<string, unknown>

describe('generateStructured', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  it('returns the validated output typed from the schema', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { title: 'Sangeet', count: 3 } } as never)
    const result = await generateStructured({ model, schema: Schema, prompt: 'plan it' })
    expect(result).toEqual({ title: 'Sangeet', count: 3 })
  })

  it('passes no tool bindings to generateText (zero-tool invariant)', async () => {
    mockGenerateText.mockResolvedValue({ output: { title: 'x', count: 1 } } as never)
    await generateStructured({ model, schema: Schema, system: 's', prompt: 'p' })
    await generateStructured({
      model,
      schema: Schema,
      messages: [{ role: 'user', content: 'p' }],
      temperature: 0,
    })
    await generateStructuredWithRepair({
      model,
      schema: Schema,
      input: { prompt: 'p' },
      repairInput: { prompt: 'r' },
      timeoutMs: 1000,
    })
    expect(mockGenerateText).toHaveBeenCalledTimes(3)
    for (let i = 0; i < 3; i++) {
      for (const key of FORBIDDEN_TOOL_KEYS) {
        expect(Object.keys(callArgs(i))).not.toContain(key)
      }
    }
  })

  it('requests structured output through Output.object, not a free-text call', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { title: 'x', count: 1 } } as never)
    await generateStructured({ model, schema: Schema, prompt: 'p' })
    expect((callArgs(0).output as { name: string }).name).toBe('object')
  })

  it('forwards system, prompt, abortSignal and temperature unchanged', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { title: 'x', count: 1 } } as never)
    const abortSignal = AbortSignal.timeout(5000)
    await generateStructured({
      model,
      schema: Schema,
      system: 'sys',
      prompt: 'user text',
      abortSignal,
      temperature: 0.3,
    })
    const args = callArgs(0)
    expect(args.model).toBe(model)
    expect(args.system).toBe('sys')
    expect(args.prompt).toBe('user text')
    expect(args.abortSignal).toBe(abortSignal)
    expect(args.temperature).toBe(0.3)
    expect(args).not.toHaveProperty('messages', expect.anything())
  })

  it('sends messages instead of prompt when messages are given', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { title: 'x', count: 1 } } as never)
    const messages = [{ role: 'user' as const, content: 'hi' }]
    await generateStructured({ model, schema: Schema, messages })
    expect(callArgs(0).messages).toBe(messages)
    expect(callArgs(0).prompt).toBeUndefined()
  })

  it('throws when the output does not match the schema', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { title: 1 } } as never)
    await expect(generateStructured({ model, schema: Schema, prompt: 'p' })).rejects.toThrow()
  })

  it('propagates provider errors such as NoObjectGeneratedError', async () => {
    const err = new NoObjectGeneratedError({
      response: { id: 'r', timestamp: new Date(), modelId: 'fake' },
      usage: {} as never,
      finishReason: 'stop',
    })
    mockGenerateText.mockRejectedValueOnce(err)
    await expect(generateStructured({ model, schema: Schema, prompt: 'p' })).rejects.toBe(err)
  })
})

describe('generateStructuredWithRepair', () => {
  const base = {
    model,
    schema: Schema,
    system: 'sys',
    input: { prompt: 'first' },
    repairInput: { prompt: 'second' },
    timeoutMs: 8000,
  }

  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  it('uses temperature 0.2 and a single call when the first attempt succeeds', async () => {
    mockGenerateText.mockResolvedValueOnce({ output: { title: 'x', count: 1 } } as never)
    await expect(generateStructuredWithRepair(base)).resolves.toEqual({ title: 'x', count: 1 })
    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(callArgs(0).temperature).toBe(0.2)
    expect(callArgs(0).prompt).toBe('first')
  })

  it('retries once at temperature 0 with the repair input after a non-timeout failure', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('schema mismatch'))
    mockGenerateText.mockResolvedValueOnce({ output: { title: 'y', count: 2 } } as never)
    await expect(generateStructuredWithRepair(base)).resolves.toEqual({ title: 'y', count: 2 })
    expect(mockGenerateText).toHaveBeenCalledTimes(2)
    expect(callArgs(1).temperature).toBe(0)
    expect(callArgs(1).prompt).toBe('second')
    expect(callArgs(1).system).toBe('sys')
    expect(callArgs(1).abortSignal).toBeInstanceOf(AbortSignal)
  })

  it('rethrows timeouts without spending the repair attempt', async () => {
    const timeout = Object.assign(new Error('The operation timed out'), { name: 'TimeoutError' })
    mockGenerateText.mockRejectedValueOnce(timeout)
    await expect(generateStructuredWithRepair(base)).rejects.toBe(timeout)
    expect(mockGenerateText).toHaveBeenCalledTimes(1)
  })

  it('throws when the repair attempt fails too', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('first'))
    mockGenerateText.mockRejectedValueOnce(new Error('second'))
    await expect(generateStructuredWithRepair(base)).rejects.toThrow('second')
    expect(mockGenerateText).toHaveBeenCalledTimes(2)
  })
})

describe('isTimeoutOrAbortError', () => {
  it('recognises timeouts and aborts by name, cause, or message', () => {
    expect(isTimeoutOrAbortError(Object.assign(new Error('x'), { name: 'TimeoutError' }))).toBe(
      true
    )
    expect(isTimeoutOrAbortError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true)
    expect(isTimeoutOrAbortError(new Error('x', { cause: { name: 'AbortError' } }))).toBe(true)
    expect(isTimeoutOrAbortError(new Error('request aborted'))).toBe(true)
  })

  it('ignores ordinary errors and non-objects', () => {
    expect(isTimeoutOrAbortError(new Error('Quota exceeded'))).toBe(false)
    expect(isTimeoutOrAbortError(null)).toBe(false)
    expect(isTimeoutOrAbortError('timeout')).toBe(false)
  })
})
