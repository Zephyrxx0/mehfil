import '@testing-library/jest-dom'

// Mock Pointer Capture APIs for Radix UI (Slider, Dialog, etc.) in Happy-DOM
if (typeof Element !== 'undefined') {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}

// Mock Canvas 2D Context for Happy-DOM environment
if (typeof HTMLCanvasElement !== 'undefined') {
  // @ts-expect-error mock context
  HTMLCanvasElement.prototype.getContext = (contextId: string) => {
    if (contextId === '2d') {
      return {
        clearRect: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        beginPath: () => {},
        moveTo: () => {},
        bezierCurveTo: () => {},
        closePath: () => {},
        fill: () => {},
        stroke: () => {},
        arc: () => {},
        strokeRect: () => {},
        fillRect: () => {},
        measureText: () => ({ width: 0 }),
      }
    }
    return null
  }
}

// Mock matchMedia if not present
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
