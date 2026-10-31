/**
 * Minimal leveled logger. Emits one JSON line per entry and redacts secrets
 * (capability keys, tokens, API keys) before anything reaches the console.
 *
 * Level comes from LOG_LEVEL (debug | info | warn | error | silent). The default is
 * `info`, or `silent` under the test runner so test output stays readable.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type ConfiguredLevel = LogLevel | 'silent'

const LEVEL_RANK: Record<ConfiguredLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
}

const SENSITIVE_KEY = /(key|token|secret|password|authorization|cookie)/i
const SECRET_IN_TEXT: ReadonlyArray<readonly [RegExp, string]> = [
  [/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED]'], // Google API keys
  [/([?&](?:key|token)=)[^&\s]+/gi, '$1[REDACTED]'], // capability keys in URLs
  [/\b[0-9a-f]{64}\b/gi, '[REDACTED]'], // 256-bit hex capability tokens and hashes
]
const MAX_DEPTH = 4

function activeLevel(): ConfiguredLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase()
  if (configured && configured in LEVEL_RANK) return configured as ConfiguredLevel
  return process.env.NODE_ENV === 'test' ? 'silent' : 'info'
}

function redactText(text: string): string {
  return SECRET_IN_TEXT.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text
  )
}

/** Returns a copy of `value` that is safe to serialise into a log line. */
export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return redactText(value)
  if (value instanceof Error) return { name: value.name, message: redactText(value.message) }
  if (value === null || typeof value !== 'object') return value
  if (depth >= MAX_DEPTH) return '[Truncated]'
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))

  return Object.fromEntries(
    Object.entries(value).map(([name, item]) => [
      name,
      SENSITIVE_KEY.test(name) ? '[REDACTED]' : redact(item, depth + 1),
    ])
  )
}

function write(level: LogLevel, scope: string, message: string, context?: unknown): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[activeLevel()]) return
  const line = JSON.stringify({
    level,
    scope,
    message: redactText(message),
    ...(context === undefined ? {} : { context: redact(context) }),
    time: new Date().toISOString(),
  })
  // The one place console is allowed: every other module goes through this logger.
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line) // eslint-disable-line no-console
}

export interface Logger {
  debug(message: string, context?: unknown): void
  info(message: string, context?: unknown): void
  warn(message: string, context?: unknown): void
  error(message: string, context?: unknown): void
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => write('debug', scope, message, context),
    info: (message, context) => write('info', scope, message, context),
    warn: (message, context) => write('warn', scope, message, context),
    error: (message, context) => write('error', scope, message, context),
  }
}
