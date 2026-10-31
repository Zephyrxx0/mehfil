'use client'

import { useEffect, useRef, useState } from 'react'
import type { PlanTabId } from '../tabs'

/**
 * Tracks which workspace tab is showing. A tab passed in by the route wins; otherwise the
 * shell keeps its own selection, starting on Budget. When the tab changes while the page is
 * scrolled past the tab bar, the new content is brought back to just under the bar.
 *
 * The bar is `sticky top-0`, so while it is stuck its own position always equals the scroll
 * position and cannot tell us whether the page was scrolled past it. Its natural position is
 * where the content after it begins (the next element) minus the bar's own height.
 */
export function useWorkspaceTab(tabFromRoute?: PlanTabId) {
  const [localTab, setLocalTab] = useState<PlanTabId>('budget')
  const activeTab = tabFromRoute ?? localTab
  const tabsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const bar = tabsRef.current
    const content = bar?.nextElementSibling
    if (!bar || !content) return
    const naturalTop = content.getBoundingClientRect().top + window.scrollY - bar.offsetHeight
    if (window.scrollY > naturalTop) window.scrollTo({ top: naturalTop })
  }, [activeTab])

  return { activeTab, selectTab: setLocalTab, tabsRef }
}
