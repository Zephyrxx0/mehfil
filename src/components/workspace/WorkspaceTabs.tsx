'use client'

import React, { forwardRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { PLAN_TABS, type PlanTabId } from './tabs'

export interface WorkspaceTabsProps {
  activeTab: PlanTabId
  /** When set, tabs are real links under this path; otherwise they are buttons. */
  basePath?: string
  adoptedCount: number
  onSelect: (tab: PlanTabId) => void
}

/** The sticky tab bar: real links when the workspace is routed, buttons otherwise. */
export const WorkspaceTabs = forwardRef<HTMLElement, WorkspaceTabsProps>(function WorkspaceTabs(
  { activeTab, basePath, adoptedCount, onSelect },
  ref
) {
  return (
    <nav
      ref={ref}
      aria-label="Workspace sections"
      className="sticky top-0 z-30 border-y border-royal-plum/10 bg-warm-ivory/95 backdrop-blur-sm"
    >
      <ul
        role="tablist"
        className="mx-auto flex w-full max-w-4xl gap-0.5 overflow-x-auto px-2 [scrollbar-width:none] sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {PLAN_TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          const classes = cn(
            'relative flex h-12 items-center px-2.5 text-sm font-medium transition-colors sm:px-1',
            isActive ? 'text-royal-plum' : 'text-royal-plum/70 hover:text-royal-plum'
          )
          const content = (
            <>
              {label}
              {id === 'ideas' && adoptedCount > 0 && (
                <span className="ml-1.5 tabular-nums text-royal-plum/70">{adoptedCount}</span>
              )}
              {/* The underline is one shared element that slides between tabs. */}
              {isActive && (
                <motion.span
                  layoutId="workspace-tab-underline"
                  className="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-royal-plum sm:inset-x-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </>
          )
          return (
            <li key={id} role="presentation" className="shrink-0">
              {basePath ? (
                <Link
                  href={`${basePath}/${id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  scroll={false}
                  className={classes}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelect(id)}
                  className={classes}
                >
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
})
