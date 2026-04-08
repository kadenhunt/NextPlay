import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

const STORAGE_KEY = 'nextplay.theme'

export type Theme = 'dark' | 'light'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === 'light' || s === 'dark') return s
  } catch {
    /* noop */
  }
  return 'dark'
}

export default function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.dataset.theme = 'dark'
    } else {
      root.classList.remove('dark')
      root.dataset.theme = 'light'
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* noop */
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
