import React from 'react'
import { Crown, Landmark, Sparkles, Users, Utensils, Zap } from 'lucide-react'

export interface VibeTradeoffs {
  feastVsSpectacle: 'feast' | 'spectacle'
  intimateVsGrand: 'intimate' | 'grand'
  heritageVsModern: 'heritage' | 'modern'
}

export interface TradeoffOption<V extends string> {
  value: V
  icon: React.ReactNode
  title: string
  description: string
}

/** One forced choice: a label and exactly two options for a single `VibeTradeoffs` key. */
export type TradeoffGroup = {
  [K in keyof VibeTradeoffs]: {
    key: K
    label: string
    options: readonly [TradeoffOption<VibeTradeoffs[K]>, TradeoffOption<VibeTradeoffs[K]>]
  }
}[keyof VibeTradeoffs]

export const TRADEOFF_GROUPS: readonly TradeoffGroup[] = [
  {
    key: 'feastVsSpectacle',
    label: '1. Dining vs Visual Drama',
    options: [
      {
        value: 'feast',
        icon: <Utensils className="w-3.5 h-3.5" />,
        title: 'Sumptuous Multi-Course Dining',
        description: 'Focus on culinary craft, live stations & feasts',
      },
      {
        value: 'spectacle',
        icon: <Sparkles className="w-3.5 h-3.5 text-marigold" aria-hidden="true" />,
        title: 'Dazzling Stage & Visual Production',
        description: 'High impact lighting, grand sets & stagecraft',
      },
    ],
  },
  {
    key: 'intimateVsGrand',
    label: '2. Gathering Energy',
    options: [
      {
        value: 'intimate',
        icon: <Users className="w-3.5 h-3.5" />,
        title: 'Warm & Cozy Close Circle',
        description: 'Personal conversations, subtle music & intimacy',
      },
      {
        value: 'grand',
        icon: <Crown className="w-3.5 h-3.5 text-royal-plum" />,
        title: 'Grand High-Energy Extravaganza',
        description: 'Expansive scale, electric beats & large crowd',
      },
    ],
  },
  {
    key: 'heritageVsModern',
    label: '3. Cultural Styling',
    options: [
      {
        value: 'heritage',
        icon: <Landmark className="w-3.5 h-3.5" />,
        title: 'Timeless Rituals & Cultural Craft',
        description: 'Traditional fabrics, classic motifs & heirloom touches',
      },
      {
        value: 'modern',
        icon: <Zap className="w-3.5 h-3.5 text-royal-plum" />,
        title: 'Contemporary Chic & Minimalist Elegance',
        description: 'Clean lines, architectural floral styling & modern palettes',
      },
    ],
  },
]
