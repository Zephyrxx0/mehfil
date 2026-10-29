import { Suspense } from 'react'
import { PlanClientPage } from './PlanClientPage'

interface LayoutProps {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

/**
 * The layout owns the workspace, so switching tabs (/budget, /timeline, ...)
 * changes the URL without remounting plan state. The tab pages render nothing.
 */
export default async function PlanLayout({ params }: LayoutProps) {
  const { id } = await params
  return (
    <Suspense fallback={null}>
      <PlanClientPage planId={id} />
    </Suspense>
  )
}
