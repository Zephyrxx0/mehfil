'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradeoffOptionCardProps {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}

/** One side of a forced choice, exposed to assistive tech as a radio. */
export function TradeoffOptionCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: TradeoffOptionCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && onSelect()}
      className={cn(
        'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
        selected
          ? 'border-marigold bg-marigold/15 shadow-xs ring-1 ring-marigold'
          : 'border-royal-plum/10 bg-white/70 hover:border-royal-plum/25'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-royal-plum/5 text-royal-plum">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-royal-plum leading-snug">{title}</span>
          <span className="text-xs text-royal-plum/70 leading-snug">{description}</span>
        </div>
      </div>
      {selected && (
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-royal-plum">
          <Check className="h-3 w-3 stroke-[3]" />
        </div>
      )}
    </motion.div>
  )
}
