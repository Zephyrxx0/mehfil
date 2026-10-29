import { notFound } from 'next/navigation'
import { PLAN_TABS } from '@/components/workspace/tabs'

interface PageProps {
  params: Promise<{ id: string; tab: string }>
}

// The workspace itself lives in ../layout.tsx; this only validates the tab.
export default async function PlanTabPage({ params }: PageProps) {
  const { tab } = await params
  if (!PLAN_TABS.some((t) => t.id === tab)) notFound()
  return null
}
