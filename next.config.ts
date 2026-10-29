import type { NextConfig } from 'next'

// Static design assets served from /public are content-stable (their contents
// change only when the filename changes), so we let browsers and CDNs cache
// them aggressively. `immutable` tells caches they never need to revalidate.
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Visual Vibe Gallery swatches (images + SVG fallbacks + the catalogue JSON).
        source: '/swatches/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      },
      {
        // Local display/brand fonts.
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      },
      {
        // Hairline line-art figures (kernel + per-figure scripts).
        source: '/hairline/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      },
    ]
  },
}

export default nextConfig
