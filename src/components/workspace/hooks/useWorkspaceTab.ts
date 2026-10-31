'use client'

import { useEffect, useRef, useState } from 'react'
import type { PlanTabId } from '../tabs'

/**
 * Tracks which workspace tab is showing. A tab passed in by the route wins; otherwise the
 * shell keeps its own selection, starting on Budget. When the tab changes while the tab bar is
 * stuck to the top, the new content is brought back to the top of the page.
 */
export function useWorkspaceTab(tabFromRoute?: PlanTabId) {
  const [localTab, setLocalTab] = useState<PlanTabId>('budget')
  const activeTab = tabFromRoute ?? localTab
  const tabsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (window.scrollY > top) window.scrollTo({ top })
  }, [activeTab])

  return { activeTab, selectTab: setLocalTab, tabsRef }
}
