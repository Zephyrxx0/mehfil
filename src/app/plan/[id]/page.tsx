import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ key?: string }>
}

export default async function PlanIndexPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { key } = await searchParams
  // Keep an edit-key capability link working: the client strips it after claiming.
  redirect(`/plan/${id}/budget${key ? `?key=${encodeURIComponent(key)}` : ''}`)
}
