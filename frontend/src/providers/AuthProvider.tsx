import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthUser = {
  id: string
  email: string
  displayName: string
}

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'nextplay.auth.user'

const AuthContext = createContext<AuthContextValue | null>(null)

function readUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [{ user, status }, setAuth] = useState(() => {
    const stored = readUserFromStorage()
    return {
      user: stored,
      status: (stored ? 'authenticated' : 'unauthenticated') as AuthStatus,
    }
  })

  const setUser = useCallback((next: AuthUser | null) => {
    setAuth({
      user: next,
      status: next ? 'authenticated' : 'unauthenticated',
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user,
      login: async (email: string, password: string) => {
        // Mock auth: require non-empty credentials.
        if (!email.trim() || !password.trim()) {
          throw new Error('Invalid email or password')
        }

        const nextUser: AuthUser = {
          id: 'user_1',
          email: email.trim(),
          displayName: email.split('@')[0] || 'Player',
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
      },
      register: async (email: string, password: string, displayName: string) => {
        if (!email.trim() || !password.trim() || !displayName.trim()) {
          throw new Error('Please complete all fields')
        }

        const nextUser: AuthUser = {
          id: 'user_1',
          email: email.trim(),
          displayName: displayName.trim(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      },
    }
  }, [status, user, setUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

