import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import Button from '@/components/Button'
import FormWrapper from '@/components/FormWrapper'
import Input from '@/components/Input'
import HeaderBrandLogo from '@/components/HeaderBrandLogo'

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
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const nextEmailError = email.trim() && email.includes('@') ? null : 'Enter a valid email'
    const nextPasswordError = password.trim().length >= 8 ? null : 'Password must be at least 8 characters'
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    return !nextEmailError && !nextPasswordError
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
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
        <div className="mx-auto mb-3 flex w-fit justify-center" aria-label="NextPlay brand">
          <HeaderBrandLogo />
        </div>
        <h1 className="font-display text-xl font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
          Sign in to NextPlay
        </h1>
        <p className="mt-1.5 text-sm font-medium tracking-tight text-zinc-600 dark:text-zinc-400">Draft. Compete. Dominate.</p>
      </div>

      <FormWrapper
        error={error}
        isLoading={loading}
        onSubmit={onSubmit}
      >
        <Input
          label="Email"
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (emailError) setEmailError(null)
          }}
          onBlur={validate}
          autoComplete="email"
          placeholder="you@example.com"
          error={emailError}
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-300">
              Password <span className="text-xs font-normal text-zinc-500">(required)</span>
            </span>
            <button
              type="button"
              className="text-xs font-medium text-zinc-600 underline decoration-zinc-400/60 underline-offset-4 transition hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600/60 dark:hover:text-zinc-200"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError(null)
            }}
            onBlur={validate}
            autoComplete="current-password"
            placeholder="Enter your password"
            error={passwordError}
          />
        </div>

        <div className="text-right text-xs">
          <Link
            to="/forgot-password"
            className="text-zinc-600 underline decoration-zinc-400/50 underline-offset-4 transition hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-500/50 dark:hover:text-zinc-200"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={!email || !password} isLoading={loading}>
          Sign in
        </Button>
        <div className="text-center text-xs text-zinc-600 dark:text-zinc-500">
          New to NextPlay?{' '}
          <Link to="/register" className="text-red-400 underline decoration-red-400/30 underline-offset-4 transition hover:text-red-300">
            Create an account
          </Link>
        </div>
      </FormWrapper>
    </div>
  )
}
