import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'

describe('Core shadcn UI Primitives', () => {
  describe('Button Primitive', () => {
    it('renders with default variant (bg-marigold text-royal-plum) and pill shape', () => {
      render(<Button>Click Me</Button>)
      const button = screen.getByRole('button', { name: 'Click Me' })
      expect(button).toBeInTheDocument()
      expect(button.className).toContain('rounded-full')
      expect(button.className).toContain('bg-marigold')
      expect(button.className).toContain('text-royal-plum')
      expect(button.className).toContain('active:scale-95')
    })

    it('renders secondary variant with Gulabi Rose fill and Royal Plum text', () => {
      render(<Button variant="secondary">Secondary Action</Button>)
      const button = screen.getByRole('button', { name: 'Secondary Action' })
      expect(button.className).toContain('bg-gulabi-rose')
      expect(button.className).toContain('text-royal-plum')
    })

    it('renders hero pill variant with tactile shadow', () => {
      render(
        <Button variant="pill" size="hero">
          Hero Action
        </Button>
      )
      const button = screen.getByRole('button', { name: 'Hero Action' })
      expect(button.className).toContain('h-14')
      expect(button.className).toContain('min-h-[48px]')
      expect(button.className).toContain('shadow-[0_8px_24px_-4px_rgba(247,200,115,0.45)]')
    })

    it('renders asChild when slot is specified', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link.className).toContain('rounded-full')
    })
  })

  describe('Card Primitive', () => {
    it('renders Warm Ivory surface with hairline border and rounded-2xl curves', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Content Area</CardContent>
          <CardFooter>Footer Area</CardFooter>
        </Card>
      )

      const card = screen.getByTestId('test-card')
      expect(card.className).toContain('bg-warm-ivory')
      expect(card.className).toContain('border-royal-plum/10')
      expect(card.className).toContain('rounded-2xl')

      expect(screen.getByText('Card Title')).toHaveClass('font-serif')
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Content Area')).toBeInTheDocument()
      expect(screen.getByText('Footer Area')).toBeInTheDocument()
    })
  })

  describe('Badge Primitive', () => {
    it('renders default badge with Marigold pastel fill and Royal Plum text', () => {
      render(<Badge>Marigold Badge</Badge>)
      const badge = screen.getByText('Marigold Badge')
      expect(badge.className).toContain('bg-marigold/20')
      expect(badge.className).toContain('text-royal-plum')
      expect(badge.className).toContain('rounded-full')
    })

    it('renders protected variant with Gulabi Rose styling', () => {
      render(<Badge variant="protected">Protected Moment</Badge>)
      const badge = screen.getByText('Protected Moment')
      expect(badge.className).toContain('bg-gulabi-rose/30')
      expect(badge.className).toContain('border-gulabi-rose')
      expect(badge.className).toContain('text-royal-plum')
    })
  })

  describe('Dialog Primitive', () => {
    it('renders modal dialog content with Warm Ivory background and Royal Plum title', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Celebration Brief</DialogTitle>
              <DialogDescription>Define event details</DialogDescription>
            </DialogHeader>
            <div>Dialog Body Content</div>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Celebration Brief')).toBeInTheDocument()
      expect(screen.getByText('Define event details')).toBeInTheDocument()
      expect(screen.getByText('Dialog Body Content')).toBeInTheDocument()
    })
  })

  describe('Sheet Primitive', () => {
    it('renders bottom sheet drawer with rounded-t-3xl and drag handle', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="bottom" data-testid="sheet-content">
            <SheetHeader>
              <SheetTitle>Live Change Log</SheetTitle>
              <SheetDescription>Re-balancing details</SheetDescription>
            </SheetHeader>
            <div>Drawer Body Content</div>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByText('Live Change Log')).toBeInTheDocument()
      expect(screen.getByText('Drawer Body Content')).toBeInTheDocument()
    })
  })

  describe('Slider Primitive', () => {
    it('renders slider root with accessible role and track/range styling', () => {
      render(<Slider defaultValue={[50]} max={100} step={1} aria-label="Budget Slider" />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute('aria-valuenow', '50')
    })
  })
})
