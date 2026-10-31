import { configureAxe } from 'vitest-axe'

/**
 * axe configured for jsdom-like environments. Colour contrast needs real layout and paint, which
 * happy-dom does not have, so contrast is enforced separately in tests/design/contrast.test.ts
 * against the actual design tokens.
 */
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
    // Whole-page rules do not apply to a component rendered into a bare container.
    region: { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
  },
})

/** Devanagari text nodes that are not inside an element marked `lang="hi"`. */
export function findUnlabelledDevanagari(root: HTMLElement): string[] {
  const devanagari = /[\u0900-\u097F]/
  const missing: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    if (devanagari.test(text) && !node.parentElement?.closest('[lang="hi"]')) {
      missing.push(text.trim())
    }
  }
  return missing
}
