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
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-50'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-red-600 text-white shadow-sm shadow-red-900/30 hover:bg-red-500 active:bg-red-700 disabled:bg-red-800',
    secondary:
      'border border-zinc-700/60 bg-zinc-900/80 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 active:bg-zinc-700',
    destructive:
      'bg-red-700/80 text-red-100 shadow-sm hover:bg-red-600 disabled:bg-red-900',
  }

  return (
    <button
      className={clsx(base, variants[variant], className)}
      disabled={effectiveDisabled}
      {...rest}
    >
      {isLoading ? (
        <span aria-hidden="true" className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {leftIcon}
      {children}
    </button>
  )
}
