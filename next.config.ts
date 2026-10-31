import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

// Files in /public keep their names when edited, so they cannot be cached as immutable.
// A day of fresh caching plus a week of stale-while-revalidate keeps repeat visits fast and
// lets edits reach returning visitors.
const STATIC_ASSET_CACHE = 'public, max-age=86400, stale-while-revalidate=604800'

// The Content-Security-Policy is built per request in src/middleware.ts because it carries a nonce.
const SECURITY_HEADERS = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  // Browsers ignore HSTS on plain http, and local development stays on http.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      {
        // Vibe Gallery swatches (images, SVG fallbacks, catalogue JSON).
        source: '/swatches/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      },
      {
        // Hairline line-art figures (kernel + per-figure scripts).
        source: '/hairline/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_ASSET_CACHE }],
      },
    ]
  },
}

// `pnpm analyze` builds with ANALYZE=true and opens treemaps of each bundle.
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

export default withBundleAnalyzer(nextConfig)
