import { useId } from 'react'

type SportType = 'football' | 'basketball' | 'baseball'

type PlayerSearchBarProps = {
  sport?: SportType
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  isLoading?: boolean
  className?: string
}

export default function PlayerSearchBar({
  sport,
  value,
  onChange,
  onSubmit,
  isLoading = false,
  className = '',
}: PlayerSearchBarProps) {
  const inputId = useId()
  const sportLabel = sport ? `${sport} players` : 'players'

  return (
    <form
      role="search"
      aria-label={`Search ${sportLabel}`}
      className={`w-full ${className}`.trim()}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search {sportLabel}
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          id={inputId}
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Search ${sportLabel}`}
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none transition focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
        />
      </div>
      {isLoading ? (
        <p className="mt-1.5 text-xs text-zinc-500" aria-live="polite">
          Searching...
        </p>
      ) : null}
    </form>
  )
}
