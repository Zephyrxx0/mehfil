# Phase 02: Festive Design System & Centerpiece Kinetic Hero — Code Patterns & Analog Mappings

**Phase:** 02 - Festive Design System & Centerpiece Kinetic Hero  
**Authoritative Specs:** `DESIGN.md`, `02-CONTEXT.md`, `02-RESEARCH.md`, `02-UI-SPEC.md`  
**Status:** Complete & Ready for Planning  

---

## 1. Overview & Architectural Blueprint

Phase 2 transitions Mehfil from a functional Phase 1 prototype into its visual identity: the 3-hue festive palette (Warm Ivory, Marigold, Gulabi Rose, Royal Plum), typography (`Fraunces`, `Plus Jakarta Sans`, `Tiro Devanagari Hindi`), styled `shadcn/ui` primitives, an animated centerpiece kinetic hero with ambient HTML5 canvas petals and jali watermark, and a responsive workspace shell (3-pane desktop, 4-tab mobile with persistent change drawer).

### Component Flow Architecture

```
src/app/layout.tsx (Next.js Google Fonts: Fraunces, Jakarta, Tiro Devanagari)
  └── src/app/globals.css (3-Hue CSS variables, 1.25rem radius, hairline plum borders)
        └── src/app/page.tsx (Landing Page orchestrator)
              ├── [Landing State]
              │     ├── src/components/hero/JaliWatermark.tsx (Ethereal SVG, 120s slow spin, mouse tilt)
              │     ├── src/components/hero/CelebrationParticles.tsx (60fps Canvas 2D petals, reduced-motion pause)
              │     ├── src/components/hero/HeroHeadline.tsx (Staggered words, 3.5s slot-machine cycling)
              │     ├── Tactile CTA Pill ("Start Your Mehfil" -> opens BriefModal)
              │     └── src/components/intake/StarterChips.tsx (Instant-launch archetypes)
              └── [Active Plan State]
                    └── src/components/workspace/WorkspaceShell.tsx
                          ├── Desktop (>= 1024px): 3-Pane Layout
                          │     ├── Left (35%): BudgetSection.tsx (Sliders, Cards, Allocations)
                          │     ├── Center (40%): TimelineSection.tsx (Milestone Bands, ICS)
                          │     └── Right (25%): ChangeExplainer.tsx (Paise rebalancing logs, Undo)
                          └── Mobile (< 1024px): 4-Tab Navigation & Persistent Bottom Drawer
                                ├── Bottom Tab Bar: [Budget, Timeline, Style, Summary]
                                └── Bottom Sheet Drawer: Change history & One-Click Undo
```

---

## 2. Inventory of Files: Created & Modified

| File Path | Role | Data Flow | Closest Analog |
| :--- | :--- | :--- | :--- |
| `src/components/ui/button.tsx` | Atomic Primitive | Props -> CVA variants + Radix Slot | Buttons in `BriefModal.tsx` & `BudgetSection.tsx` |
| `src/components/ui/card.tsx` | Atomic Primitive | Props -> Warm Ivory container + hairline border | Container in `BudgetLineCard.tsx` |
| `src/components/ui/badge.tsx` | Atomic Primitive | Props -> Pill badge with pastel fills & Plum text | Status badge in `BudgetLineCard.tsx` |
| `src/components/ui/dialog.tsx` | Atomic Primitive | Open state -> Radix Dialog with blur backdrop | Overlay in `BriefModal.tsx` |
| `src/components/ui/sheet.tsx` | Atomic Primitive | Open state + `side` -> Sliding drawer primitive | Overlay in `BriefModal.tsx` + CVA in `button.tsx` |
| `src/components/ui/slider.tsx` | Atomic Primitive | Controlled value -> Radix Slider with Marigold track | Stepper in `BudgetSection.tsx` |
| `src/components/hero/HeroHeadline.tsx` | Hero Presentation | Archetype rotation state -> `motion/react` springs | Hero text in `page.tsx` + `DESIGN.md` §7.1 |
| `src/components/hero/CelebrationParticles.tsx` | Ambient Canvas | Canvas ref + RAF loop -> 2D petal physics | Canvas lifecycle in React `useEffect` |
| `src/components/hero/JaliWatermark.tsx` | Ambient SVG | Mouse coords -> dampened tilt + CSS 120s spin | Background motif in `page.tsx` |
| `src/components/workspace/ChangeExplainer.tsx` | Domain Presentation | Plan snapshots & deltas -> plain-language cards | `ShortfallBanner.tsx` & `BudgetLineCard.tsx` |
| `src/components/workspace/WorkspaceShell.tsx` | Responsive Container | Viewport size & tab state -> 3-pane or 4-tab shell | `PlanWorkspace.tsx` tab switching |
| `tests/design/tokens.test.ts` | Verification Test | Math contrast + source AST scanning -> assertions | `tests/engine/currency.test.ts` |
| `tests/components/Hero.test.tsx` | Component Test | Render + timers + DOM inspection -> assertions | `tests/components/BriefModal.test.tsx` |
| `tests/components/WorkspaceShell.test.tsx` | Component Test | Render + fireEvent tabs/sliders -> assertions | `tests/components/PlanWorkspace.test.tsx` |
| `src/app/layout.tsx` (MODIFIED) | Root Layout | Next.js Google Fonts -> HTML root CSS variables | Existing `src/app/layout.tsx` |
| `src/app/globals.css` (MODIFIED) | Global Tokens | HSL color tokens -> CSS root variables | Existing `src/app/globals.css` |
| `tailwind.config.ts` (MODIFIED) | Tailwind Config | CSS variables -> Tailwind utility classes | Existing `tailwind.config.ts` |
| `src/app/page.tsx` (MODIFIED) | Landing Page | Plan state -> renders Hero or WorkspaceShell | Existing `src/app/page.tsx` |
| `src/components/intake/BriefModal.tsx` (MODIFIED) | Modal Dialog | Intake wizard state -> shadcn Dialog primitive | Existing `src/components/intake/BriefModal.tsx` |
| `src/components/workspace/BudgetLineCard.tsx` (MODIFIED) | Category Card | BudgetLine prop -> shadcn Card/Badge/Button | Existing `src/components/workspace/BudgetLineCard.tsx` |
| `src/components/workspace/ShortfallBanner.tsx` (MODIFIED) | Alert Banner | Shortfall state -> shadcn Card/Button | Existing `src/components/workspace/ShortfallBanner.tsx` |
| `src/components/workspace/PlanWorkspace.tsx` (MODIFIED) | Container Wrapper | Plan state -> delegates to WorkspaceShell | Existing `src/components/workspace/PlanWorkspace.tsx` |
| `tests/setup.ts` (MODIFIED) | Test Config | Browser polyfills -> happy-dom test environment | Existing `tests/setup.ts` |

---

## 3. Pattern Specifications for New Files

### 3.1 `src/components/ui/button.tsx`

- **Role:** Atomic button primitive supporting CVA variants, polymorphic `asChild` via `@radix-ui/react-slot`, and Mehfil 3-hue tokens.
- **Closest Analog:** Buttons in `src/components/intake/BriefModal.tsx` (lines 35-43, 207-225) and `src/lib/utils.ts`.
- **Imports Pattern:**
  ```tsx
  import * as React from 'react'
  import { Slot } from '@radix-ui/react-slot'
  import { cva, type VariantProps } from 'class-variance-authority'
  import { cn } from '@/lib/utils'
  ```
- **Core Implementation Pattern:**
  ```tsx
  const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
    {
      variants: {
        variant: {
          default:
            'bg-marigold text-royal-plum shadow-[0_4px_20px_-2px_rgba(247,200,115,0.4)] hover:bg-marigold/90',
          secondary:
            'bg-gulabi-rose text-royal-plum shadow-xs hover:bg-gulabi-rose/90',
          outline:
            'border border-royal-plum/10 bg-transparent text-royal-plum hover:bg-royal-plum/5',
          ghost:
            'text-royal-plum hover:bg-royal-plum/5',
          destructive:
            'bg-[#D95D39] text-warm-ivory shadow-xs hover:bg-[#D95D39]/90',
          pill:
            'bg-marigold text-royal-plum font-bold shadow-[0_8px_24px_-4px_rgba(247,200,115,0.45)] hover:bg-marigold/95',
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
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {
    asChild?: boolean
  }

  export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : 'button'
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }
  )
  Button.displayName = 'Button'
  ```

---

### 3.2 `src/components/ui/card.tsx`

- **Role:** Atomic container primitive styled with Warm Ivory, hairline Plum border (`border-royal-plum/10`), and `1.25rem` (`rounded-2xl` / `rounded-3xl`) curves.
- **Closest Analog:** Container card in `src/components/workspace/BudgetLineCard.tsx` (lines 33-40).
- **Core Implementation Pattern:**
  ```tsx
  import * as React from 'react'
  import { cn } from '@/lib/utils'

  export const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-royal-plum/10 bg-warm-ivory text-royal-plum transition-all',
        className
      )}
      {...props}
    />
  ))
  Card.displayName = 'Card'

  export const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  ))
  CardHeader.displayName = 'CardHeader'

  export const CardTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
  >(({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-serif font-bold text-xl text-royal-plum leading-none tracking-tight', className)}
      {...props}
    />
  ))
  CardTitle.displayName = 'CardTitle'

  export const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
  >(({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs text-royal-plum/60 leading-relaxed', className)}
      {...props}
    />
  ))
  CardDescription.displayName = 'CardDescription'

  export const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ))
  CardContent.displayName = 'CardContent'

  export const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0 border-t border-royal-plum/8 mt-4', className)}
      {...props}
    />
  ))
  CardFooter.displayName = 'CardFooter'
  ```

---

### 3.3 `src/components/ui/badge.tsx`

- **Role:** Atomic badge primitive styled with 3-hue pastels, hairline borders, and strict Royal Plum text.
- **Closest Analog:** Badges in `src/components/workspace/BudgetLineCard.tsx` (lines 47-54).
- **Core Implementation Pattern:**
  ```tsx
  import * as React from 'react'
  import { cva, type VariantProps } from 'class-variance-authority'
  import { cn } from '@/lib/utils'

  const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden',
    {
      variants: {
        variant: {
          default:
            'bg-marigold/20 text-royal-plum border border-marigold/40',
          secondary:
            'bg-gulabi-rose/25 text-royal-plum border border-gulabi-rose/40',
          protected:
            'bg-gulabi-rose/30 text-royal-plum border border-gulabi-rose uppercase font-bold tracking-wider text-2xs',
          outline:
            'border border-royal-plum/15 text-royal-plum bg-white/60',
          destructive:
            'bg-[#D95D39]/15 text-[#D95D39] border border-[#D95D39]/30 font-semibold',
        },
      },
      defaultVariants: {
        variant: 'default',
      },
    }
  )

  export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
      VariantProps<typeof badgeVariants> {}

  export function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
  }
  ```

---

### 3.4 `src/components/ui/dialog.tsx`

- **Role:** Accessible modal primitive wrapping `@radix-ui/react-dialog` with Royal Plum blur backdrop and `rounded-3xl` Warm Ivory content.
- **Closest Analog:** `src/components/intake/BriefModal.tsx` (lines 75-85).
- **Core Implementation Pattern:**
  ```tsx
  import * as React from 'react'
  import * as DialogPrimitive from '@radix-ui/react-dialog'
  import { X } from 'lucide-react'
  import { cn } from '@/lib/utils'

  export const Dialog = DialogPrimitive.Root
  export const DialogTrigger = DialogPrimitive.Trigger
  export const DialogPortal = DialogPrimitive.Portal
  export const DialogClose = DialogPrimitive.Close

  export const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-royal-plum/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  ))
  DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

  export const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-3xl border border-royal-plum/10 bg-warm-ivory p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:p-8',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 rounded-full p-1.5 text-royal-plum/50 hover:bg-royal-plum/5 hover:text-royal-plum transition-opacity focus:outline-hidden">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  ))
  DialogContent.displayName = DialogPrimitive.Content.displayName

  export const DialogHeader = ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn('flex flex-col space-y-1.5 text-left', className)}
      {...props}
    />
  )
  DialogHeader.displayName = 'DialogHeader'

  export const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-2xl font-serif font-bold text-royal-plum', className)}
      {...props}
    />
  ))
  DialogTitle.displayName = DialogPrimitive.Title.displayName
  ```

---

### 3.5 `src/components/ui/sheet.tsx`

- **Role:** Sliding bottom drawer / sidebar primitive wrapping `@radix-ui/react-dialog` with `rounded-t-3xl` for the mobile workspace change explainer.
- **Closest Analog:** `BriefModal.tsx` overlay structure + CVA variants.
- **Core Implementation Pattern:**
  ```tsx
  import * as React from 'react'
  import * as SheetPrimitive from '@radix-ui/react-dialog'
  import { cva, type VariantProps } from 'class-variance-authority'
  import { X } from 'lucide-react'
  import { cn } from '@/lib/utils'

  export const Sheet = SheetPrimitive.Root
  export const SheetTrigger = SheetPrimitive.Trigger
  export const SheetClose = SheetPrimitive.Close
  export const SheetPortal = SheetPrimitive.Portal

  export const SheetOverlay = React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
  >(({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-royal-plum/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
      ref={ref}
    />
  ))
  SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

  const sheetVariants = cva(
    'fixed z-50 gap-4 bg-warm-ivory p-6 shadow-xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-400 data-[state=open]:animate-in data-[state=closed]:animate-out',
    {
      variants: {
        side: {
          top: 'inset-x-0 top-0 border-b border-royal-plum/10 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
          bottom:
            'inset-x-0 bottom-0 rounded-t-3xl border-t border-royal-plum/10 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom max-h-[85vh] overflow-y-auto',
          left: 'inset-y-0 left-0 h-full w-3/4 border-r border-royal-plum/10 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
          right:
            'inset-y-0 right-0 h-full w-3/4 border-l border-royal-plum/10 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
        },
      },
      defaultVariants: {
        side: 'bottom',
      },
    }
  )

  interface SheetContentProps
    extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
      VariantProps<typeof sheetVariants> {}

  export const SheetContent = React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Content>,
    SheetContentProps
  >(({ side = 'bottom', className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {/* Persistent drag handle for bottom drawer */}
        {side === 'bottom' && (
          <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-royal-plum/20" />
        )}
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-royal-plum/50 hover:bg-royal-plum/5 hover:text-royal-plum focus:outline-hidden">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  ))
  SheetContent.displayName = SheetPrimitive.Content.displayName
  ```

---

### 3.6 `src/components/ui/slider.tsx`

- **Role:** Accessible slider primitive wrapping `@radix-ui/react-slider` with Plum thumb, Marigold active track, and Ivory background groove.
- **Closest Analog:** Stepper in `src/components/workspace/BudgetSection.tsx` (lines 54-82).
- **Core Implementation Pattern:**
  ```tsx
  import * as React from 'react'
  import * as SliderPrimitive from '@radix-ui/react-slider'
  import { cn } from '@/lib/utils'

  export const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
  >(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-royal-plum/10">
        <SliderPrimitive.Range className="absolute h-full bg-marigold" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-warm-ivory bg-royal-plum shadow-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-royal-plum focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-110 cursor-grab active:cursor-grabbing" />
    </SliderPrimitive.Root>
  ))
  Slider.displayName = SliderPrimitive.Root.displayName
  ```

---

### 3.7 `src/components/hero/HeroHeadline.tsx`

- **Role:** Centerpiece kinetic typography displaying Devanagari wordmark, staggered Fraunces words, and vertical slot-machine sentiment cycling across `['Wedding', 'Milestone', 'Soirée', 'Mehfil']`.
- **Closest Analog:** Hero title in `src/app/page.tsx` (lines 55-71).
- **Imports Pattern:**
  ```tsx
  import React, { useState, useEffect } from 'react'
  import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
  ```
- **Motion Physics Parameters (`DESIGN.md` §7.1):**
  - Stagger: `staggerChildren: 0.04` (40ms)
  - Celebratory Settle: `stiffness: 120, damping: 18, mass: 1.2`
  - Vertical slot entry: `initial: { y: 24, opacity: 0, filter: 'blur(4px)' }`, `animate: { y: 0, opacity: 1, filter: 'blur(0px)' }`, `exit: { y: -24, opacity: 0, filter: 'blur(4px)' }`
  - Reduced Motion Fallback: when `shouldReduceMotion` is true, remove `y` and `filter`, using pure 200ms opacity crossfade.
- **Core Implementation Pattern:**
  ```tsx
  const SENTIMENTS = ['Wedding', 'Milestone', 'Soirée', 'Mehfil']

  export function HeroHeadline() {
    const [index, setIndex] = useState(0)
    const shouldReduceMotion = useReducedMotion()

    useEffect(() => {
      const timer = setInterval(() => {
        setIndex((prev) => (prev + 1) % SENTIMENTS.length)
      }, 3500)
      return () => clearInterval(timer)
    }, [])

    return (
      <div className="flex flex-col items-center text-center">
        {/* Devanagari Brand Wordmark */}
        <div className="flex items-center gap-2.5 mb-6">
          <span className="font-devanagari text-3xl sm:text-4xl font-bold tracking-tight text-royal-plum">
            महफ़िल
          </span>
          <span className="text-xs uppercase tracking-widest text-royal-plum/50 font-medium">
            Mehfil
          </span>
        </div>

        {/* Celebratory Staggered Display Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold text-royal-plum tracking-tight leading-[1.08] max-w-4xl">
          Where your{' '}
          <span className="inline-block relative min-w-[200px] sm:min-w-[280px] h-[1.15em] overflow-hidden align-bottom">
            <AnimatePresence mode="wait">
              <motion.span
                key={SENTIMENTS[index]}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { y: 28, opacity: 0, filter: 'blur(4px)' }
                }
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { y: 0, opacity: 1, filter: 'blur(0px)' }
                }
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { y: -28, opacity: 0, filter: 'blur(4px)' }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0.2 }
                    : { type: 'spring', stiffness: 120, damping: 18, mass: 1.2 }
                }
                className="absolute inset-0 inline-block italic text-marigold underline decoration-royal-plum/20 underline-offset-8"
              >
                {SENTIMENTS[index]}
              </motion.span>
            </AnimatePresence>
          </span>{' '}
          moves in harmony.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-royal-plum/70 max-w-2xl leading-relaxed">
          Where budget, timeline, and cherished moments connect mathematically in integer paise. Zero float drift, zero hallucinated arithmetic.
        </p>
      </div>
    )
  }
  ```

---

### 3.8 `src/components/hero/CelebrationParticles.tsx`

- **Role:** Ambient celebration particles rendered on an HTML5 Canvas layer (`requestAnimationFrame`) running at 60fps with zero DOM bloat and zero cursor lag.
- **Closest Analog:** React `useEffect` with canvas drawing lifecycle; safe fallback check `canvas.getContext('2d')`.
- **Core Implementation Pattern:**
  ```tsx
  import React, { useEffect, useRef } from 'react'

  interface Petal {
    x: number
    y: number
    radius: number
    scale: number
    rotation: number
    vRot: number
    vy: number
    swayPhase: number
    swaySpeed: number
    color: string
    opacity: number
  }

  const COLORS = ['#F7C873', '#F2A7B8'] // Marigold and Gulabi Rose

  export function CelebrationParticles() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Safe getContext check (prevents happy-dom test crashes)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Respect prefers-reduced-motion
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) return

      let animationFrameId: number
      let width = (canvas.width = window.innerWidth)
      let height = (canvas.height = window.innerHeight)

      const handleResize = () => {
        if (!canvas) return
        width = canvas.width = window.innerWidth
        height = canvas.height = window.innerHeight
      }
      window.addEventListener('resize', handleResize)

      // Initialize 25-35 petals
      const petals: Petal[] = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 6 + Math.random() * 6,
        scale: 0.6 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        vy: 0.3 + Math.random() * 0.5,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.01 + Math.random() * 0.02,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.35 + Math.random() * 0.35,
      }))

      const render = () => {
        ctx.clearRect(0, 0, width, height)

        for (const p of petals) {
          p.y += p.vy
          p.swayPhase += p.swaySpeed
          p.x += Math.sin(p.swayPhase) * 0.5
          p.rotation += p.vRot

          // Wrap around edges
          if (p.y > height + 20) {
            p.y = -20
            p.x = Math.random() * width
          }
          if (p.x > width + 20) p.x = -20
          if (p.x < -20) p.x = width + 20

          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.scale(p.scale, p.scale)
          ctx.beginPath()
          ctx.moveTo(0, -p.radius)
          ctx.bezierCurveTo(p.radius * 0.8, -p.radius * 0.5, p.radius * 0.8, p.radius * 0.5, 0, p.radius)
          ctx.bezierCurveTo(-p.radius * 0.8, p.radius * 0.5, -p.radius * 0.8, -p.radius * 0.5, 0, -p.radius)
          ctx.closePath()
          ctx.fillStyle = p.color
          ctx.globalAlpha = p.opacity
          ctx.fill()
          ctx.restore()
        }

        animationFrameId = requestAnimationFrame(render)
      }

      animationFrameId = requestAnimationFrame(render)

      return () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(animationFrameId)
      }
    }, [])

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
    )
  }
  ```

---

### 3.9 `src/components/hero/JaliWatermark.tsx`

- **Role:** Ethereal geometric Indian jali / rangoli vector mandala acting as a soft background watermark (`opacity: 0.06`) with continuous 120s slow rotation and dampened mouse tilt on desktop.
- **Closest Analog:** Background presentation in `src/app/page.tsx` + CSS keyframe animation.
- **Core Implementation Pattern:**
  ```tsx
  import React, { useState, useEffect } from 'react'

  export function JaliWatermark() {
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    useEffect(() => {
      // Parallax only on fine pointer devices
      const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (!isFinePointer) return

      let targetX = 0
      let targetY = 0
      let currentX = 0
      let currentY = 0
      let rafId: number

      const onMouseMove = (e: MouseEvent) => {
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 2
        targetX = ((e.clientX - cx) / cx) * 6 // max ±6px
        targetY = ((e.clientY - cy) / cy) * 6
      }

      const loop = () => {
        currentX += (targetX - currentX) * 0.05
        currentY += (targetY - currentY) * 0.05
        setOffset({ x: currentX, y: currentY })
        rafId = requestAnimationFrame(loop)
      }

      window.addEventListener('mousemove', onMouseMove)
      rafId = requestAnimationFrame(loop)

      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        cancelAnimationFrame(rafId)
      }
    }, [])

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] select-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        }}
      >
        <svg
          viewBox="0 0 800 800"
          className="w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] animate-spin-slow stroke-royal-plum fill-none"
          strokeWidth="1.2"
        >
          {/* Concentric 8-fold Indian geometric jali rings & petals */}
          <circle cx="400" cy="400" r="380" strokeDasharray="6 6" />
          <circle cx="400" cy="400" r="320" />
          <circle cx="400" cy="400" r="240" strokeDasharray="4 4" />
          <circle cx="400" cy="400" r="160" />
          <circle cx="400" cy="400" r="80" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 400 400)`}>
              <path d="M400,20 C430,120 470,220 400,320 C330,220 370,120 400,20 Z" />
              <path d="M400,80 C420,160 450,240 400,320 C350,240 380,160 400,80 Z" strokeDasharray="2 2" />
            </g>
          ))}
        </svg>
      </div>
    )
  }
  ```

---

### 3.10 `src/components/workspace/ChangeExplainer.tsx`

- **Role:** Explains integer paise redistributions, floor protections, and provides a prominent One-Click Undo action.
- **Closest Analog:** `src/components/workspace/ShortfallBanner.tsx` (lines 21-55) & `src/components/workspace/BudgetLineCard.tsx` (lines 26-31, 72-83).
- **Core Implementation Pattern:**
  ```tsx
  import React from 'react'
  import type { Plan } from '@/lib/engine/types'
  import { formatINR } from '@/lib/engine/currency'
  import { RotateCcw, ShieldCheck, TrendingUp, TrendingDown, Info } from 'lucide-react'
  import { Button } from '@/components/ui/button'
  import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'

  interface ChangeExplainerProps {
    plan: Plan
    previousGuestCount?: number
    onUndo?: () => void
  }

  export function ChangeExplainer({ plan, previousGuestCount, onUndo }: ChangeExplainerProps) {
    const isGuestScaled = previousGuestCount !== undefined && previousGuestCount !== plan.brief.guestCount
    const guestDelta = isGuestScaled ? plan.brief.guestCount - previousGuestCount : 0

    // Find lines with non-zero delta
    const deltaLines = plan.lines.filter((l) => l.currentPaise !== l.baselinePaise)

    return (
      <Card className="h-full flex flex-col justify-between shadow-xs border-royal-plum/10">
        <div>
          <CardHeader className="pb-3 border-b border-royal-plum/8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Live Change Explainer</CardTitle>
              {onUndo && isGuestScaled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  className="h-7 gap-1 px-2.5 text-xs font-semibold"
                >
                  <RotateCcw className="w-3 h-3 text-royal-plum" />
                  <span>Undo</span>
                </Button>
              )}
            </div>
            <p className="text-xs text-royal-plum/60 mt-1">
              Deterministic Hare-Niemeyer math balances budget in integer paise.
            </p>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col gap-3">
            {/* Scale status */}
            {isGuestScaled && (
              <div className="rounded-xl bg-warm-ivory border border-royal-plum/10 p-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Guest Scale Delta</span>
                  <Badge variant={guestDelta > 0 ? 'default' : 'secondary'}>
                    {guestDelta > 0 ? `+${guestDelta} guests` : `${guestDelta} guests`}
                  </Badge>
                </div>
                <p className="text-2xs text-royal-plum/60 mt-1">
                  Baseline: {plan.baselineGuestCount} → Current: {plan.brief.guestCount}
                </p>
              </div>
            )}

            {/* Protected Moment Indicator */}
            <div className="rounded-xl bg-gulabi-rose/15 border border-gulabi-rose/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-royal-plum">
                <ShieldCheck className="w-4 h-4 text-gulabi-rose" />
                <span>Protected Moment Locked</span>
              </div>
              <p className="text-2xs text-royal-plum/70 mt-1">
                Category <span className="font-semibold capitalize">{plan.brief.protectedCategory}</span> is structurally immune to donor trimming (ADR-0004).
              </p>
            </div>

            {/* Delta Stack */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-2xs uppercase tracking-wider text-royal-plum/50 font-semibold">
                Allocation Adjustments ({deltaLines.length})
              </span>
              {deltaLines.length === 0 ? (
                <div className="text-xs text-royal-plum/50 py-3 text-center italic">
                  No adjustments made yet. All allocations at baseline archetype.
                </div>
              ) : (
                deltaLines.map((line) => {
                  const delta = line.currentPaise - line.baselinePaise
                  return (
                    <div
                      key={line.id}
                      className="flex items-center justify-between rounded-lg bg-white/60 p-2 text-xs border border-royal-plum/5"
                    >
                      <span className="font-medium text-royal-plum">{line.name}</span>
                      <span
                        className={`font-mono text-2xs font-bold ${
                          delta > 0 ? 'text-emerald-700' : 'text-amber-800'
                        }`}
                      >
                        {delta > 0 ? `+${formatINR(delta)}` : `-${formatINR(Math.abs(delta))}`}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </div>

        {/* Invariant guarantee footer */}
        <div className="p-4 border-t border-royal-plum/8 bg-royal-plum/2 rounded-b-2xl flex items-center gap-2 text-2xs text-royal-plum/60">
          <Info className="w-3.5 h-3.5 text-royal-plum/40 shrink-0" />
          <span>Sum of allocations exactly equals {formatINR(plan.totalBudgetPaise)}. Zero paise leakage.</span>
        </div>
      </Card>
    )
  }
  ```

---

### 3.11 `src/components/workspace/WorkspaceShell.tsx`

- **Role:** Responsive container that orchestrates a 3-pane desktop layout (35% Budget, 40% Timeline, 25% Explainer) and a 4-tab mobile view (`[Budget, Timeline, Style, Summary]`) with a persistent bottom drawer sheet.
- **Closest Analog:** Tab switching in `src/components/workspace/PlanWorkspace.tsx` (lines 114-152).
- **Core Implementation Pattern:**
  ```tsx
  import React, { useState } from 'react'
  import type { Plan, BudgetCategory, ShortfallRemedy } from '@/lib/engine/types'
  import { calculateBackwardsTimeline } from '@/lib/engine/timeline'
  import { BudgetSection } from './BudgetSection'
  import { TimelineSection } from './TimelineSection'
  import { ChangeExplainer } from './ChangeExplainer'
  import { ShortfallBanner } from './ShortfallBanner'
  import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
  import { Coins, Calendar, Palette, FileText, ChevronUp } from 'lucide-react'

  interface WorkspaceShellProps {
    plan: Plan
    previousGuestCount?: number
    onGuestCountChange: (count: number) => void
    onSetProtected: (category: BudgetCategory) => void
    onApplyRemedy: (remedy: ShortfallRemedy) => void
    onUndo?: () => void
  }

  type MobileTab = 'budget' | 'timeline' | 'style' | 'summary'

  export function WorkspaceShell({
    plan,
    previousGuestCount,
    onGuestCountChange,
    onSetProtected,
    onApplyRemedy,
    onUndo,
  }: WorkspaceShellProps) {
    const [mobileTab, setMobileTab] = useState<MobileTab>('budget')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const schedule = calculateBackwardsTimeline(
      plan.brief.eventDate,
      plan.brief.guestCount
    )

    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Shortfall Banner */}
        <ShortfallBanner
          plan={plan}
          previousGuestCount={previousGuestCount}
          onApplyRemedy={onApplyRemedy}
          onUndo={onUndo}
        />

        {/* Desktop 3-Pane Layout (lg: and xl: viewports) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: 35% (approx 4 of 12 cols = 33-35%) */}
          <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
            <BudgetSection
              plan={plan}
              onGuestCountChange={onGuestCountChange}
              onSetProtected={onSetProtected}
            />
          </div>

          {/* Center Pane: 40% (approx 4-5 of 12 cols = 38-40%) */}
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
            <TimelineSection plan={plan} schedule={schedule} />
          </div>

          {/* Right Pane: 25% (approx 3 of 12 cols = 25%) */}
          <div className="lg:col-span-3 sticky top-24 max-h-[calc(100vh-180px)]">
            <ChangeExplainer
              plan={plan}
              previousGuestCount={previousGuestCount}
              onUndo={onUndo}
            />
          </div>
        </div>

        {/* Mobile / Tablet View (< 1024px) */}
        <div className="block lg:hidden flex flex-col pb-28">
          {mobileTab === 'budget' && (
            <BudgetSection
              plan={plan}
              onGuestCountChange={onGuestCountChange}
              onSetProtected={onSetProtected}
            />
          )}

          {mobileTab === 'timeline' && (
            <TimelineSection plan={plan} schedule={schedule} />
          )}

          {mobileTab === 'style' && (
            <div className="rounded-2xl border border-royal-plum/10 bg-warm-ivory p-6 text-center">
              <h3 className="font-serif font-bold text-lg text-royal-plum">Style DNA</h3>
              <p className="text-xs text-royal-plum/60 mt-1">
                Aesthetic identity & Protected Moment highlights ({plan.brief.protectedCategory}).
              </p>
            </div>
          )}

          {mobileTab === 'summary' && (
            <div className="rounded-2xl border border-royal-plum/10 bg-warm-ivory p-6 text-center">
              <h3 className="font-serif font-bold text-lg text-royal-plum">Plan Summary</h3>
              <p className="text-xs text-royal-plum/60 mt-1">
                {plan.brief.title} • {plan.brief.city} • {plan.brief.eventDate}
              </p>
            </div>
          )}

          {/* Persistent Bottom Change Drawer Bar */}
          <div className="fixed bottom-16 inset-x-0 z-30 px-4">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="w-full flex items-center justify-between rounded-full bg-royal-plum/90 text-warm-ivory px-4 py-2.5 text-xs font-semibold shadow-lg backdrop-blur-md active:scale-98 transition"
            >
              <span>Guests: {plan.brief.guestCount} • Protected: {plan.brief.protectedCategory}</span>
              <div className="flex items-center gap-1 text-marigold">
                <span>Change Log</span>
                <ChevronUp className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Mobile Bottom Sheet Drawer */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetContent side="bottom">
              <ChangeExplainer
                plan={plan}
                previousGuestCount={previousGuestCount}
                onUndo={onUndo}
              />
            </SheetContent>
          </Sheet>

          {/* 4-Tab Bottom Navigation Bar */}
          <nav className="fixed bottom-0 inset-x-0 z-40 bg-warm-ivory/95 border-t border-royal-plum/10 backdrop-blur-md h-16 flex items-center justify-around px-2">
            {[
              { id: 'budget', label: 'Budget', icon: Coins },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'style', label: 'Style', icon: Palette },
              { id: 'summary', label: 'Summary', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobileTab(id as MobileTab)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition ${
                  mobileTab === id
                    ? 'text-royal-plum font-bold'
                    : 'text-royal-plum/50 hover:text-royal-plum/80'
                }`}
              >
                <Icon className={`w-5 h-5 ${mobileTab === id ? 'text-marigold' : ''}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    )
  }
  ```

---

## 4. Pattern Specifications for Modified Files

### 4.1 `src/app/layout.tsx`

- **Role:** Next.js Root Layout with zero-layout-shift font loading.
- **Current Code:** Standard `<head>` stylesheet `<link>` tags pointing to Google Fonts URLs.
- **Pattern to Apply:**
  ```tsx
  import type { Metadata } from 'next'
  import { Fraunces, Plus_Jakarta_Sans, Tiro_Devanagari_Hindi } from 'next/font/google'
  import './globals.css'

  const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-fraunces',
    display: 'swap',
  })

  const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
  })

  const tiroDevanagari = Tiro_Devanagari_Hindi({
    weight: '400',
    subsets: ['devanagari', 'latin'],
    variable: '--font-tiro',
    display: 'swap',
  })

  export const metadata: Metadata = {
    title: 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity',
    description:
      'Intelligent milestone celebration workspace where budget and timeline form a mathematically locked plan in integer paise.',
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html
        lang="en"
        className={`${fraunces.variable} ${jakarta.variable} ${tiroDevanagari.variable}`}
      >
        <body className="min-h-screen bg-warm-ivory text-royal-plum font-sans selection:bg-marigold selection:text-royal-plum">
          {children}
        </body>
      </html>
    )
  }
  ```

---

### 4.2 `src/app/globals.css` & `tailwind.config.ts`

- **Role:** Ensure clean CSS variables without trailing slash bugs in `--border`, calibrate radii to `1.25rem`, add font families and slow rotation animation.
- **Globals CSS Fix:**
  Change:
  `--border: 287 29% 20% / 0.10;`
  To:
  `--border: 287 29% 20%;`
  And apply opacity in Tailwind utilities as `border-royal-plum/10` or `border-border/10`.
- **Tailwind Config Extension:**
  ```ts
  import type { Config } from 'tailwindcss'

  const config: Config = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
          sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
          devanagari: ['var(--font-tiro)', 'serif'],
        },
        colors: {
          'warm-ivory': '#FFF8EE',
          marigold: '#F7C873',
          'gulabi-rose': '#F2A7B8',
          'royal-plum': '#3A2442',
        },
        animation: {
          'spin-slow': 'spin 120s linear infinite',
        },
      },
    },
    plugins: [require('tailwindcss-animate')],
  }
  export default config
  ```

---

### 4.3 `tests/setup.ts`

- **Role:** Polyfill happy-dom missing browser APIs to prevent Radix Slider and HTML5 Canvas test crashes.
- **Pattern to Apply:**
  ```ts
  import '@testing-library/jest-dom'

  // Polyfill setPointerCapture / releasePointerCapture for Radix Slider
  if (typeof window !== 'undefined') {
    if (!window.HTMLElement.prototype.setPointerCapture) {
      window.HTMLElement.prototype.setPointerCapture = () => {}
    }
    if (!window.HTMLElement.prototype.releasePointerCapture) {
      window.HTMLElement.prototype.releasePointerCapture = () => {}
    }
    if (!window.HTMLElement.prototype.hasPointerCapture) {
      window.HTMLElement.prototype.hasPointerCapture = () => false
    }

    // Polyfill HTMLCanvasElement 2D context for happy-dom
    if (!HTMLCanvasElement.prototype.getContext) {
      // @ts-expect-error Mocking 2d context
      HTMLCanvasElement.prototype.getContext = () => null
    }
  }
  ```

---

## 5. Verification & Anti-Pattern Test Suites

### 5.1 `tests/design/tokens.test.ts`

- **Role:** Programmatic mathematical WCAG AAA contrast assertion and automated static AST/regex scan asserting no `text-white` on pastels and no pure black `#000000`.
- **Closest Analog:** `tests/engine/currency.test.ts` (pure mathematical tests) and `fs` operations.
- **Pattern:**
  ```ts
  import { describe, it, expect } from 'vitest'
  import fs from 'fs'
  import path from 'path'

  // Relative Luminance formula per WCAG 2.1
  function getLuminance(hex: string): number {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)!
      .map((x) => parseInt(x, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }

  function getContrast(hex1: string, hex2: string): number {
    const l1 = getLuminance(hex1)
    const l2 = getLuminance(hex2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  describe('Design Tokens Contrast Suite', () => {
    const PLUM = '#3A2442'
    const IVORY = '#FFF8EE'
    const MARIGOLD = '#F7C873'
    const ROSE = '#F2A7B8'
    const WHITE = '#FFFFFF'

    it('validates Royal Plum exceeds WCAG AAA (7:1) on all three Mehfil fills', () => {
      const plumOnIvory = getContrast(PLUM, IVORY)
      const plumOnMarigold = getContrast(PLUM, MARIGOLD)
      const plumOnRose = getContrast(PLUM, ROSE)

      expect(plumOnIvory).toBeGreaterThanOrEqual(7.0) // ~13.18
      expect(plumOnMarigold).toBeGreaterThanOrEqual(7.0) // ~8.91
      expect(plumOnRose).toBeGreaterThanOrEqual(7.0) // ~7.28
    })

    it('proves white text catastrophically fails WCAG AA on pastels', () => {
      const whiteOnMarigold = getContrast(WHITE, MARIGOLD)
      const whiteOnRose = getContrast(WHITE, ROSE)

      expect(whiteOnMarigold).toBeLessThan(3.0) // ~1.56
      expect(whiteOnRose).toBeLessThan(3.0) // ~1.91
    })

    it('enforces codebase ban: no text-white alongside bg-marigold or bg-gulabi-rose', () => {
      const srcDir = path.resolve(__dirname, '../../src')
      const getFiles = (dir: string): string[] => {
        let results: string[] = []
        const list = fs.readdirSync(dir)
        for (const file of list) {
          const fullPath = path.resolve(dir, file)
          const stat = fs.statSync(fullPath)
          if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath))
          } else if (file.endsWith('.tsx') || file.endsWith('.css')) {
            results.push(fullPath)
          }
        }
        return results
      }

      const files = getFiles(srcDir)
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8')
        // Banned pattern: elements combining bg-marigold or bg-gulabi-rose with text-white
        const marigoldWithWhite = /bg-marigold[^\n"']*text-white/g.test(content)
        const roseWithWhite = /bg-gulabi-rose[^\n"']*text-white/g.test(content)
        expect(marigoldWithWhite, `Found text-white with bg-marigold in ${file}`).toBe(false)
        expect(roseWithWhite, `Found text-white with bg-gulabi-rose in ${file}`).toBe(false)
      }
    })
  })
  ```

---

## 6. Planning Checklist for Next Agents

1. **Wave 1:**
   - [ ] Update `src/app/layout.tsx` to `next/font/google`.
   - [ ] Calibrate `src/app/globals.css` and `tailwind.config.ts`.
   - [ ] Update `tests/setup.ts` with pointer capture and canvas mock.
   - [ ] Implement `src/components/ui/` primitives: `button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `sheet.tsx`, `slider.tsx`.
2. **Wave 2:**
   - [ ] Implement `src/components/hero/HeroHeadline.tsx`.
   - [ ] Implement `src/components/hero/CelebrationParticles.tsx`.
   - [ ] Implement `src/components/hero/JaliWatermark.tsx`.
   - [ ] Integrate centerpiece hero and tactile CTA into `src/app/page.tsx`.
3. **Wave 3:**
   - [ ] Implement `src/components/workspace/ChangeExplainer.tsx`.
   - [ ] Implement `src/components/workspace/WorkspaceShell.tsx`.
   - [ ] Update `src/components/workspace/PlanWorkspace.tsx` to use `WorkspaceShell`.
4. **Wave 4:**
   - [ ] Refactor `BriefModal.tsx`, `BudgetLineCard.tsx`, and `ShortfallBanner.tsx` to shadcn primitives.
   - [ ] Implement `tests/design/tokens.test.ts`.
   - [ ] Implement `tests/components/Hero.test.tsx` and `tests/components/WorkspaceShell.test.tsx`.
   - [ ] Run full test suite with zero regressions.
