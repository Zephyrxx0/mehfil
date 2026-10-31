import { NextResponse, type NextRequest } from 'next/server'
import { buildContentSecurityPolicy, generateNonce } from '@/lib/security/csp'

/**
 * Applies a per-request nonce CSP to page responses. Next.js reads the nonce from the
 * request's CSP header and stamps it on its own inline and bundled scripts.
 */
export function middleware(request: NextRequest) {
  const nonce = generateNonce()
  const policy = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV !== 'production',
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', policy)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', policy)
  return response
}

export const config = {
  matcher: [
    {
      // Pages only: skip API routes, build output, and static files.
      source: '/((?!api|_next/static|_next/image|favicon.ico|hairline|swatches|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
