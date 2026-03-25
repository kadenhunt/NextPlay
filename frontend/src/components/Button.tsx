import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'destructive'

export type ButtonProps = {
  variant?: ButtonVariant
  isLoading?: boolean
  leftIcon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({
  variant = 'primary',
  isLoading = false,
  leftIcon,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const effectiveDisabled = disabled || isLoading

  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-70'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-slate-100 text-slate-950 shadow-sm hover:bg-white hover:shadow transition disabled:bg-slate-400',
    secondary:
      'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-800',
    destructive:
      'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-400',
  }

  return (
    <button
      className={clsx(base, variants[variant], className)}
      disabled={effectiveDisabled}
      {...rest}
    >
      {isLoading ? (
        <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      ) : null}
      {leftIcon}
      {children}
    </button>
  )
}

