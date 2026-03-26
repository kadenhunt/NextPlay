import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import Button from '@/components/Button'
import FormWrapper from '@/components/FormWrapper'
import Input from '@/components/Input'

export default function LoginPage() {
  const { status, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const fromPath =
    typeof location.state === 'object' && location.state?.from
      ? String((location.state as { from?: string }).from)
      : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(fromPath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [status, user, navigate])

  if (status === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-md items-center justify-center p-6 text-zinc-400">
        Loading...
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/[0.06] blur-3xl" />

      <div className="relative mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg shadow-black/30 ring-1 ring-zinc-700/50">
          <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.8 25.6L11 6.4H17.2L23.3 25.6H18.8L14.2 10.8L9.4 25.6H4.8Z" fill="#fafafa" />
            <path d="M15.8 19.4L27.8 6.8L24.1 18.2H27.3L20 26.1L21.7 20.2L18 20.2L15.8 19.4Z" fill="#a63038" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Sign in to NextPlay</h1>
        <p className="mt-1.5 text-sm text-zinc-500">Fantasy sports, your way.</p>
      </div>

      <FormWrapper
        error={error}
        isLoading={loading}
        onSubmit={onSubmit}
      >
        <Input
          label="Email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
        />

        <Button type="submit" className="w-full" disabled={!email || !password} isLoading={loading}>
          Sign in
        </Button>
        <div className="text-center text-xs text-zinc-500">
          New to NextPlay?{' '}
          <Link to="/register" className="text-red-400 underline decoration-red-400/30 underline-offset-4 transition hover:text-red-300">
            Create an account
          </Link>
        </div>
      </FormWrapper>
    </div>
  )
}
