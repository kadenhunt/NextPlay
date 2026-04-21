import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'

import { getApiBaseUrl, HttpApiError, postJson } from '@/services/api/httpClient'

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
  logout: () => Promise<void>
}

const STORAGE_KEY = 'nextplay.auth.user'
const EMAIL_VERIFIED_KEY = 'nextplay.auth.emailVerified'

const useServerAuth = () => import.meta.env.VITE_USE_SERVER_AUTH === 'true'

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/forgot-password']

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

function sessionUrl() {
  const base = getApiBaseUrl()
  return base ? `${base}/api/auth/session` : '/api/auth/session'
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const serverAuth = useServerAuth()
  const location = useLocation()

  const [{ user, status, emailVerified }, setAuth] = useState(() => {
    if (serverAuth) {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const onPublic = PUBLIC_AUTH_PATHS.includes(path)
      if (onPublic) {
        return {
          user: null as AuthUser | null,
          status: 'unauthenticated' as AuthStatus,
          emailVerified: false,
        }
      }
      return {
        user: null as AuthUser | null,
        status: 'loading' as AuthStatus,
        emailVerified: false,
      }
    }
    const stored = readUserFromStorage()
    const verified = localStorage.getItem(EMAIL_VERIFIED_KEY) === '1'
    return {
      user: stored,
      status: (stored ? 'authenticated' : 'unauthenticated') as AuthStatus,
      emailVerified: stored ? verified : false,
    }
  })

  const setUser = useCallback((next: AuthUser | null, nextEmailVerified?: boolean) => {
    setAuth((prev) => ({
      user: next,
      status: next ? 'authenticated' : 'unauthenticated',
      emailVerified: next ? (nextEmailVerified ?? prev.emailVerified) : false,
    }))
  }, [])

  useEffect(() => {
    if (!serverAuth) return

    if (PUBLIC_AUTH_PATHS.includes(location.pathname)) {
      setAuth({ user: null, status: 'unauthenticated', emailVerified: false })
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const response = await fetch(sessionUrl(), { credentials: 'include' })
        if (cancelled) return
        if (!response.ok) {
          setAuth({ user: null, status: 'unauthenticated', emailVerified: false })
          return
        }
        const data = (await response.json()) as {
          user?: { id: string; email: string; displayName: string; emailVerified?: boolean }
        }
        if (data.user) {
          setAuth({
            user: {
              id: data.user.id,
              email: data.user.email,
              displayName: data.user.displayName,
            },
            status: 'authenticated',
            emailVerified: Boolean(data.user.emailVerified),
          })
        } else {
          setAuth({ user: null, status: 'unauthenticated', emailVerified: false })
        }
      } catch {
        if (!cancelled) {
          setAuth({ user: null, status: 'unauthenticated', emailVerified: false })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [serverAuth, location.pathname])

  const logout = useCallback(async () => {
    if (serverAuth) {
      try {
        const base = getApiBaseUrl()
        const url = base ? `${base}/api/auth/logout` : '/api/auth/logout'
        await fetch(url, { method: 'POST', credentials: 'include' })
      } catch {
        /* still clear client */
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(EMAIL_VERIFIED_KEY)
    setAuth({ user: null, status: 'unauthenticated', emailVerified: false })
  }, [serverAuth])

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user,
      emailVerified,
      login: async (email: string, password: string) => {
        if (!email.trim() || !password.trim()) {
          throw new Error('Invalid email or password')
        }

        if (serverAuth) {
          try {
            const data = await postJson<{ user: AuthUser & { emailVerified?: boolean } }, Record<string, string>>(
              '/api/auth/login',
              { email: email.trim(), password },
            )
            if (!data?.user) throw new Error('Login failed')
            setAuth({
              user: {
                id: data.user.id,
                email: data.user.email,
                displayName: data.user.displayName,
              },
              status: 'authenticated',
              emailVerified: Boolean(data.user.emailVerified),
            })
          } catch (err) {
            if (err instanceof HttpApiError) throw new Error(err.message)
            throw err instanceof Error ? err : new Error('Login failed')
          }
          return
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

        if (serverAuth) {
          try {
            const data = await postJson<{ user: AuthUser & { emailVerified?: boolean } }, Record<string, string>>(
              '/api/auth/register',
              { email: email.trim(), password, displayName: displayName.trim() },
            )
            if (!data?.user) throw new Error('Registration failed')
            setAuth({
              user: {
                id: data.user.id,
                email: data.user.email,
                displayName: data.user.displayName,
              },
              status: 'authenticated',
              emailVerified: Boolean(data.user.emailVerified),
            })
          } catch (err) {
            if (err instanceof HttpApiError) throw new Error(err.message)
            throw err instanceof Error ? err : new Error('Registration failed')
          }
          return
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
        await Promise.resolve()
      },
      updateProfile: async (displayName: string) => {
        if (!user) throw new Error('Not authenticated')
        if (!displayName.trim()) throw new Error('Display name is required')
        if (serverAuth) {
          throw new Error('Profile updates on the server are not implemented yet.')
        }
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
        if (serverAuth) {
          setAuth((prev) =>
            prev.user
              ? { ...prev, emailVerified: true }
              : prev,
          )
          return
        }
        localStorage.setItem(EMAIL_VERIFIED_KEY, '1')
        if (user) {
          setUser(user, true)
        }
      },
      logout,
    }
  }, [status, user, emailVerified, setUser, logout, serverAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
