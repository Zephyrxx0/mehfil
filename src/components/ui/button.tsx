import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-[transform,background-color,box-shadow,color] duration-200 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[0.97] motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'bg-marigold text-royal-plum shadow-[0_4px_20px_-2px_rgba(247,200,115,0.4)] hover:bg-marigold/90',
        secondary: 'bg-gulabi-rose text-royal-plum shadow-xs hover:bg-gulabi-rose/90',
        outline: 'border border-royal-plum/10 bg-transparent text-royal-plum hover:bg-royal-plum/5',
        ghost: 'text-royal-plum hover:bg-royal-plum/5',
        destructive: 'bg-terracotta text-warm-ivory shadow-xs hover:bg-terracotta/90',
        pill: 'bg-marigold text-royal-plum font-bold shadow-[0_8px_24px_-4px_rgba(247,200,115,0.45)] hover:bg-marigold/95',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-12 px-7 text-base',
        hero: 'h-14 px-8 text-lg min-h-[48px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'
