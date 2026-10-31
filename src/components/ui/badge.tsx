import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden',
  {
    variants: {
      variant: {
        default: 'bg-marigold/20 text-royal-plum border border-marigold/40',
        secondary: 'bg-gulabi-rose/25 text-royal-plum border border-gulabi-rose/40',
        protected:
          'bg-gulabi-rose/30 text-royal-plum border border-gulabi-rose uppercase font-bold tracking-wider text-2xs',
        outline: 'border border-royal-plum/15 text-royal-plum bg-white/60',
        destructive: 'bg-terracotta/15 text-terracotta border border-terracotta/30 font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
