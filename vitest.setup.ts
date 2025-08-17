import '@testing-library/jest-dom'
import React from 'react'

// Mock the OGL Iridescence background to avoid WebGL/canvas in tests
vi.mock('./src/components/Iridescence.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'iridescence-mock', style: { position: 'fixed', inset: 0 } }),
}))

// Mock global alert to avoid ReferenceError in jsdom
// @ts-ignore
if (!(globalThis as any).alert) {
  // @ts-ignore
  ;(globalThis as any).alert = vi.fn()
}
