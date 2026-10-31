import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useWorkspaceTab } from '@/components/workspace/hooks/useWorkspaceTab'
import type { PlanTabId } from '@/components/workspace/tabs'

/**
 * The tab bar is `sticky top-0`: while it is stuck, its own rect.top equals the scroll position,
 * so the hook must work out where the bar would sit unstuck from the content after it.
 */

const NAV_HEIGHT = 48
const CONTENT_TOP_IN_DOCUMENT = 400 // content starts 400px down the page, so the bar sits at 352

function Harness({ tab }: { tab: PlanTabId }) {
  const { tabsRef } = useWorkspaceTab(tab)
  return React.createElement(
    'div',
    null,
    React.createElement('nav', { ref: tabsRef, 'data-testid': 'nav' }),
    React.createElement('main', { 'data-testid': 'content' })
  )
}

let scrollY = 0
let scrollTo: ReturnType<typeof vi.fn>

beforeEach(() => {
  scrollY = 0
  scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => NAV_HEIGHT,
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    // The content's viewport top moves as the page scrolls; the stuck bar stays at 0.
    const top =
      this.tagName === 'MAIN'
        ? CONTENT_TOP_IN_DOCUMENT - scrollY
        : Math.max(0, CONTENT_TOP_IN_DOCUMENT - NAV_HEIGHT - scrollY)
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top } as DOMRect
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'scrollY')
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight')
})

describe('useWorkspaceTab: scroll on tab change', () => {
  it('brings the content back under the bar when the page was scrolled past it', () => {
    const view = render(React.createElement(Harness, { tab: 'budget' }))
    scrollTo.mockClear() // ignore the mount effect

    scrollY = 900
    view.rerender(React.createElement(Harness, { tab: 'ideas' }))

    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ top: CONTENT_TOP_IN_DOCUMENT - NAV_HEIGHT })
  })

  it('does not move the page when it has not been scrolled past the bar', () => {
    const view = render(React.createElement(Harness, { tab: 'budget' }))
    scrollTo.mockClear()

    scrollY = 100 // above the bar's natural position (352)
    view.rerender(React.createElement(Harness, { tab: 'timeline' }))

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('does not move the page when the tab did not change', () => {
    const view = render(React.createElement(Harness, { tab: 'budget' }))
    scrollTo.mockClear()

    scrollY = 900
    view.rerender(React.createElement(Harness, { tab: 'budget' }))

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
