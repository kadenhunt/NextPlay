import type { FormEvent, ReactNode } from 'react'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  error?: string | null
  isLoading?: boolean
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void | Promise<void>
}

export default function FormWrapper({
  title,
  description,
  children,
  error,
  isLoading,
  onSubmit,
}: Props) {
  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      {title ? <h1 className="text-xl font-semibold text-zinc-100">{title}</h1> : null}
      {description ? (
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          void onSubmit?.(e)
        }}
      >
        {isLoading ? <fieldset disabled className="contents" /> : null}
        {children}
      </form>
    </div>
  )
}
