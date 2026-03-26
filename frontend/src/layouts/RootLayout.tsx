import type { PropsWithChildren } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import TopTicker from '@/components/TopTicker'
import DevModeToggle from '@/components/DevModeToggle'
import { USES_MOCK_BACKEND } from '@/services/api/nextplayApi'

export default function RootLayout({ children }: PropsWithChildren) {
  const { status, user, logout } = useAuth()
  const { devMode } = useDevMode()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dark min-h-dvh bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          >
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-zinc-700/50"
              aria-hidden="true"
            >
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.8 25.6L11 6.4H17.2L23.3 25.6H18.8L14.2 10.8L9.4 25.6H4.8Z"
                  fill="#fafafa"
                />
                <path
                  d="M15.8 19.4L27.8 6.8L24.1 18.2H27.3L20 26.1L21.7 20.2L18 20.2L15.8 19.4Z"
                  fill="#a63038"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Next<span className="text-red-500">Play</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <DevModeToggle />

            {status === 'authenticated' && user ? (
              <button
                type="button"
                className="rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                onClick={onLogout}
              >
                Logout
              </button>
            ) : (
              <div className="text-xs text-zinc-500">
                {status === 'loading' ? 'Loading...' : ''}
              </div>
            )}
          </div>
        </div>

        {USES_MOCK_BACKEND && (
          <div className="border-t border-zinc-800/90 bg-zinc-900/70 px-4 py-1.5 text-center text-[11px] leading-snug text-zinc-500">
            <span className="font-semibold text-zinc-400">Mock API</span>
            {' — '}
            In-browser stub with local storage only. Next step: real DB + API; this stays obvious on purpose.
          </div>
        )}

        {devMode && (
          <div className="border-t border-red-500/20 bg-red-500/[0.06] px-4 py-1.5 text-center text-[11px] font-medium leading-snug tracking-wide text-red-400/90">
            Dev mode — Demo-only tools: state shortcuts, commissioner bypass, and synthetic season rows when a league
            shell is empty. Turn off for the plain mock experience.
          </div>
        )}

        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
      </header>

      <TopTicker userId={user?.id} />

      <main className="animate-fade-up mx-auto w-full max-w-7xl px-6 py-8">
        {children}
        <Outlet />
      </main>
    </div>
  )
}
