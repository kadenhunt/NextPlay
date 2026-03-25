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
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-slate-900">
      {title ? <h1 className="text-xl font-semibold">{title}</h1> : null}
      {description ? (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
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

