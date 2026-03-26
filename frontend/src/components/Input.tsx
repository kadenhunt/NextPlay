import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

type Props = {
  label?: string
  hint?: string
  error?: string | null
  isLoading?: boolean
} & InputHTMLAttributes<HTMLInputElement>

export default function Input({
  label,
  hint,
  error,
  isLoading,
  className,
  id,
  disabled,
  ...rest
}: Props) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          disabled={disabled || isLoading}
          className={clsx(
            'w-full rounded-lg border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600',
            'border-zinc-700/60 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500/60' : null,
            className,
          )}
          {...rest}
        />

        {isLoading ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : hint ? (
        <div className="text-xs text-zinc-500">{hint}</div>
      ) : null}
    </div>
  )
}
