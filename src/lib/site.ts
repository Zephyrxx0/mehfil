/**
 * The public address of this app. Used for metadata, the calendar export's identifiers and the
 * fallback origin for share links. Set NEXT_PUBLIC_APP_URL to point a deployment elsewhere.
 *
 * VERCEL_URL is deliberately not used: on Vercel it is the per-deployment preview hostname, and
 * canonical links and identifiers should stay on the production address.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://bookmymehfil.vercel.app'
).replace(/\/+$/, '')

/** Host name only, for identifiers that must not change between deployments. */
export const SITE_HOST = new URL(SITE_URL).host
