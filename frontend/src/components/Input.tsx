import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

type Props = {
  label?: string
  hint?: string
  error?: string | null
  isLoading?: boolean
  labelClassName?: string
} & InputHTMLAttributes<HTMLInputElement>

export default function Input({
  label,
  hint,
  error,
  isLoading,
  labelClassName,
  className,
  id,
  disabled,
  ...rest
}: Props) {
  const generatedId = useId()
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase() ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className={clsx('text-sm font-medium text-zinc-800 dark:text-zinc-300', labelClassName)}>
          {label}{' '}
          {typeof rest.required === 'boolean' ? (
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-500">
              {rest.required ? '(required)' : '(optional)'}
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          disabled={disabled || isLoading}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500',
            'border-zinc-300 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20',
            'dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-600',
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
        <div id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      ) : hint ? (
        <div id={hintId} className="text-xs text-zinc-600 dark:text-zinc-500">
          {hint}
        </div>
      ) : null}
    </div>
  )
}
