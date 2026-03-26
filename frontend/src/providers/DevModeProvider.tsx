import { createContext, useCallback, useContext, useState } from 'react'
import type { PropsWithChildren } from 'react'

type DevModeContextValue = {
  devMode: boolean
  toggleDevMode: () => void
}

/** Same key mock layer reads so demo-only synthetic data stays off until Dev mode is on. */
export const NEXTPLAY_DEV_MODE_STORAGE_KEY = 'nextplay.devMode'

const DevModeContext = createContext<DevModeContextValue>({
  devMode: false,
  toggleDevMode: () => {},
})

export default function DevModeProvider({ children }: PropsWithChildren) {
  const [devMode, setDevMode] = useState(() => {
    try {
      return localStorage.getItem(NEXTPLAY_DEV_MODE_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const toggleDevMode = useCallback(() => {
    setDevMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem(NEXTPLAY_DEV_MODE_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* noop */
      }
      return next
    })
  }, [])

  return (
    <DevModeContext.Provider value={{ devMode, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  return useContext(DevModeContext)
}
