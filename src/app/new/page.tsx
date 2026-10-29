import { Suspense } from 'react'
import { NewPlanClient } from './NewPlanClient'

export const metadata = { title: 'Plan a celebration — Mehfil (महफ़िल)' }

export default function NewPlanPage() {
  return (
    <Suspense fallback={null}>
      <NewPlanClient />
    </Suspense>
  )
}
