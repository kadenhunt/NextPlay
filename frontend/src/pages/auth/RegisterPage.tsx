import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import Button from '@/components/Button'
import FormWrapper from '@/components/FormWrapper'
import Input from '@/components/Input'
import HeaderBrandLogo from '@/components/HeaderBrandLogo'

export default function RegisterPage() {
  const { status, user, register } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordStrength = (() => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()

  const strengthLabel =
    passwordStrength >= 4 ? 'Strong' : passwordStrength >= 3 ? 'Good' : passwordStrength >= 2 ? 'Fair' : 'Weak'

  const validate = () => {
    const nextDisplayNameError = displayName.trim().length >= 2 ? null : 'Use at least 2 characters'
    const nextEmailError = email.trim() && email.includes('@') ? null : 'Enter a valid email'
    const nextPasswordError = password.length >= 8 ? null : 'Use at least 8 characters'
    setDisplayNameError(nextDisplayNameError)
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    return !nextDisplayNameError && !nextEmailError && !nextPasswordError
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    try {
      await register(email, password, displayName)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
          Create your account
        </h1>
        <p className="mt-1.5 text-sm font-medium tracking-tight text-zinc-600 dark:text-zinc-400">Draft. Compete. Dominate.</p>
      </div>

      <FormWrapper
        error={error}
        isLoading={loading}
        onSubmit={onSubmit}
      >
        <Input
          label="Display name"
          id="displayName"
          required
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value)
            if (displayNameError) setDisplayNameError(null)
          }}
          onBlur={validate}
          autoComplete="name"
          placeholder="Your name"
          error={displayNameError}
        />
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
            autoComplete="new-password"
            placeholder="Choose a password"
            error={passwordError}
            hint={`Strength: ${strengthLabel}`}
          />
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/60" aria-hidden="true">
            <div
              className={[
                'h-full transition-all',
                passwordStrength >= 4 ? 'w-full bg-emerald-500' : passwordStrength >= 3 ? 'w-3/4 bg-lime-500' : passwordStrength >= 2 ? 'w-1/2 bg-amber-500' : 'w-1/4 bg-red-500',
              ].join(' ')}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!displayName || !email || !password}
          isLoading={loading}
        >
          Create account
        </Button>
        <div className="text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-red-400 underline decoration-red-400/30 underline-offset-4 transition hover:text-red-300">
            Sign in
          </Link>
        </div>
      </FormWrapper>
    </div>
  )
}
