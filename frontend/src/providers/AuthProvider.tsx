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
  emailVerified: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updateProfile: (displayName: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  markEmailVerifiedForDemo: () => void
  logout: () => void
}

const STORAGE_KEY = 'nextplay.auth.user'
const EMAIL_VERIFIED_KEY = 'nextplay.auth.emailVerified'

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
  const [{ user, status, emailVerified }, setAuth] = useState(() => {
    const stored = readUserFromStorage()
    const verified = localStorage.getItem(EMAIL_VERIFIED_KEY) === '1'
    return {
      user: stored,
      status: (stored ? 'authenticated' : 'unauthenticated') as AuthStatus,
      emailVerified: stored ? verified : false,
    }
  })

  const setUser = useCallback((next: AuthUser | null, nextEmailVerified?: boolean) => {
    setAuth({
      user: next,
      status: next ? 'authenticated' : 'unauthenticated',
      emailVerified: next ? (nextEmailVerified ?? emailVerified) : false,
    })
  }, [emailVerified])

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user,
      emailVerified,
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
        const verified = localStorage.getItem(EMAIL_VERIFIED_KEY) === '1'
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser, verified)
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
        localStorage.setItem(EMAIL_VERIFIED_KEY, '0')
        setUser(nextUser, false)
      },
      requestPasswordReset: async (email: string) => {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Enter a valid email address')
        }
        // Mock-only placeholder to unblock frontend UX before backend mailer exists.
        await Promise.resolve()
      },
      updateProfile: async (displayName: string) => {
        if (!user) throw new Error('Not authenticated')
        if (!displayName.trim()) throw new Error('Display name is required')
        const nextUser: AuthUser = {
          ...user,
          displayName: displayName.trim(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
      },
      resendVerificationEmail: async () => {
        if (!user?.email) throw new Error('Not authenticated')
        await Promise.resolve()
      },
      markEmailVerifiedForDemo: () => {
        localStorage.setItem(EMAIL_VERIFIED_KEY, '1')
        if (user) {
          setUser(user, true)
        }
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EMAIL_VERIFIED_KEY)
        setUser(null)
      },
    }
  }, [status, user, emailVerified, setUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

