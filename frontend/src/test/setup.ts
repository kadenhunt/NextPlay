import '@testing-library/jest-dom/vitest'

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
}

const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('sessionStorage', sessionStorageMock)

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
})

afterEach(() => {
  cleanup()
  window.localStorage?.clear?.()
  window.sessionStorage?.clear?.()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
