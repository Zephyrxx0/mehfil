import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PlanClientPage } from './PlanClientPage'

// Static on purpose: the plan lives in the browser or behind an edit key, so the title must not
// read it. `absolute` skips the site title template, which would repeat "Mehfil". These pages
// are capability URLs, so they stay out of search indexes.
export const metadata: Metadata = {
  title: { absolute: 'Your celebration plan — Mehfil' },
  robots: { index: false, follow: false },
}

interface LayoutProps {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

/**
 * The layout owns the workspace, so switching tabs (/budget, /timeline, ...)
 * changes the URL without remounting plan state. The tab pages render nothing, but `children`
 * must still be rendered: Next mounts a page's metadata (title, robots) with the page itself, so
 * a layout that drops `children` loses the `<title>` on every client-side tab switch.
 */
export default async function PlanLayout({ params, children }: LayoutProps) {
  const { id } = await params
  return (
    <>
      <Suspense fallback={null}>
        <PlanClientPage planId={id} />
      </Suspense>
      {children}
    </>
  )
}
