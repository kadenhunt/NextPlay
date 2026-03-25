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
    <div className="space-y-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          disabled={disabled || isLoading}
          className={clsx(
            'w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition',
            'border-gray-200 focus:border-emerald-400 dark:border-gray-800 dark:bg-slate-900 dark:focus:border-emerald-400',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-400' : null,
            className,
          )}
          {...rest}
        />

        {isLoading ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600/40 border-t-emerald-500" />
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="text-xs text-red-700 dark:text-red-200">{error}</div>
      ) : hint ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>
      ) : null}
    </div>
  )
}

