import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/Button'
import FormWrapper from '@/components/FormWrapper'
import Input from '@/components/Input'
import HeaderBrandLogo from '@/components/HeaderBrandLogo'
import { useAuth } from '@/providers/AuthProvider'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/[0.06] blur-3xl" />
      <div className="relative mb-8 text-center">
        <div className="mx-auto mb-3 flex w-fit justify-center" aria-label="NextPlay brand">
          <HeaderBrandLogo />
        </div>
        <h1 className="font-display text-xl font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
          Reset your password
        </h1>
        <p className="mt-1.5 text-sm font-medium tracking-tight text-zinc-600 dark:text-zinc-400">
          We will send recovery steps to your email.
        </p>
      </div>

      <FormWrapper error={error} isLoading={loading} onSubmit={onSubmit}>
        {sent ? (
          <div className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Reset instructions sent. Check your inbox and spam folder.
          </div>
        ) : null}
        <Input
          label="Email"
          id="forgot-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Button type="submit" className="w-full" disabled={!email} isLoading={loading}>
          Send reset link
        </Button>
        <div className="text-center text-xs text-zinc-500">
          Remembered your password?{' '}
          <Link to="/login" className="text-red-500 underline decoration-red-400/40 underline-offset-4 transition hover:text-red-600">
            Back to sign in
          </Link>
        </div>
      </FormWrapper>
    </div>
  )
}
