import type { PropsWithChildren } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import TopTicker from '@/components/TopTicker'

export default function RootLayout({ children }: PropsWithChildren) {
  const { status, user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dark min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-500/60"
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-b from-white/10 to-white/5 shadow-[0_8px_30px_rgba(255,255,255,0.06)]"
              aria-hidden="true"
            >
              <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.8 25.6L11 6.4H17.2L23.3 25.6H18.8L14.2 10.8L9.4 25.6H4.8Z"
                  fill="#E5E7EB"
                />
                <path
                  d="M15.8 19.4L27.8 6.8L24.1 18.2H27.3L20 26.1L21.7 20.2L18 20.2L15.8 19.4Z"
                  fill="#EF4444"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Next<span className="text-red-400">Play</span>
            </span>
          </Link>

          {status === 'authenticated' && user ? (
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition hover:border-red-400/30 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              onClick={onLogout}
            >
              Logout
            </button>
          ) : (
            <div className="text-sm text-slate-300/70">
              {status === 'loading' ? 'Loading…' : 'Not signed in'}
            </div>
          )}
        </div>
        <div className="mx-auto flex max-w-7xl items-center justify-between border-t border-white/5 px-6 pb-2 pt-1 text-[11px] text-slate-400">
          <span>Modern fantasy college sports framework</span>
          <span className="hidden sm:inline">Dark UI + red momentum accents</span>
        </div>
      </header>
      <TopTicker userId={user?.id} />

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {children}
        <Outlet />
      </main>
    </div>
  )
}

