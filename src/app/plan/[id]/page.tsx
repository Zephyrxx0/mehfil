import { PlanClientPage } from './PlanClientPage'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ key?: string }>
}

export default async function PlanPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { key } = await searchParams

  return <PlanClientPage planId={id} initialKey={key} />
}
