import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@/providers/ThemeProvider'

function useReducedAnimation() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const go = () =>
      setReduced(
        mq.matches || document.documentElement.dataset.motion === 'reduce',
      )
    go()
    mq.addEventListener('change', go)
    const obs = new MutationObserver(go)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-motion'],
    })
    return () => {
      mq.removeEventListener('change', go)
      obs.disconnect()
    }
  }, [])
  return reduced
}

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" className="stroke-current" strokeWidth="1.5" />
      <path d="M12 3v18M3.5 12h17" className="stroke-current" strokeWidth="1.1" />
      <path
        d="M5.8 6.5c2.8 2.1 2.8 8.9 0 11M18.2 6.5c-2.8 2.1-2.8 8.9 0 11"
        className="stroke-current"
        strokeWidth="1.05"
      />
    </svg>
  )
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const reduced = useReducedAnimation()
  const isDark = theme === 'dark'
  const [bouncing, setBouncing] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  const handleClick = () => {
    if (reduced) {
      toggleTheme()
      return
    }
    clearTimers()
    setBouncing(true)
    toggleTheme()
    timers.current.push(
      window.setTimeout(() => setBouncing(false), 520),
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full border border-zinc-300 bg-zinc-50 text-zinc-800 shadow-sm transition-colors duration-300 ease-out hover:border-zinc-400 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/40"
      aria-label={label}
      title={label}
    >
      <span
        className={[
          'flex h-[1.4rem] w-[1.4rem] items-center justify-center transition-colors duration-300 ease-out',
          bouncing ? 'theme-ball-bounce' : '',
        ].join(' ')}
      >
        <BasketballIcon className="h-full w-full" />
      </span>
    </button>
  )
}
