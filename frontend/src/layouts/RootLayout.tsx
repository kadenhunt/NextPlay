import { useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import TopTicker from '@/components/TopTicker'
import DevModeToggle from '@/components/DevModeToggle'
import { listMyLeagues } from '@/services/api/nextplayApi'

type DemoStep = {
  path: string
  waitMs: number
  label: string
}

export default function RootLayout({ children }: PropsWithChildren) {
  const { status, user, logout } = useAuth()
  const { devMode } = useDevMode()
  const navigate = useNavigate()
  const [demoPlaying, setDemoPlaying] = useState(false)
  const [demoStepIdx, setDemoStepIdx] = useState(0)
  const userId = user?.id

  const leaguesQuery = useQuery({
    queryKey: ['myLeagues', userId],
    queryFn: () => listMyLeagues(userId!),
    enabled: Boolean(userId),
  })

  const demoSteps = useMemo<DemoStep[]>(() => {
    let leagueId = ''
    const baseballLeagueId = leaguesQuery.data?.find((l) => l.sport === 'baseball')?.id ?? ''
    try {
      leagueId = localStorage.getItem('nextplay.demo.lastLeagueId') ?? ''
    } catch {
      /* noop */
    }

    // Prefer baseball for richer seeded demo data.
    if (baseballLeagueId) {
      leagueId = baseballLeagueId
    } else if (!leagueId) {
      leagueId = leaguesQuery.data?.[0]?.id ?? ''
    }

    if (!leagueId) {
      return [{ path: '/dashboard', waitMs: 4200, label: 'Dashboard' }]
    }

    return [
      { path: '/dashboard', waitMs: 4500, label: 'Dashboard' },
      { path: `/league/${leagueId}`, waitMs: 4200, label: 'League overview' },
      { path: `/league/${leagueId}/draft`, waitMs: 5200, label: 'Draft' },
      { path: `/league/${leagueId}/team`, waitMs: 7000, label: 'Team scoring' },
      { path: `/league/${leagueId}/players`, waitMs: 5600, label: 'Players' },
      { path: `/league/${leagueId}/matchups`, waitMs: 7600, label: 'Matchups' },
      { path: `/league/${leagueId}/standings`, waitMs: 5200, label: 'Standings' },
      { path: `/league/${leagueId}/chat`, waitMs: 4200, label: 'Chat' },
      { path: '/dashboard', waitMs: 3400, label: 'Wrap up' },
    ]
  }, [leaguesQuery.data])

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (!demoPlaying) return
    const step = demoSteps[demoStepIdx]
    if (!step) {
      setDemoPlaying(false)
      setDemoStepIdx(0)
      return
    }

    navigate(step.path)
    const t = window.setTimeout(() => {
      if (demoStepIdx >= demoSteps.length - 1) {
        setDemoPlaying(false)
        setDemoStepIdx(0)
      } else {
        setDemoStepIdx((i) => i + 1)
      }
    }, step.waitMs)
    return () => window.clearTimeout(t)
  }, [demoPlaying, demoStepIdx, demoSteps, navigate])

  const onToggleDemoPlay = () => {
    if (demoPlaying) {
      setDemoPlaying(false)
      setDemoStepIdx(0)
      return
    }
    setDemoStepIdx(0)
    setDemoPlaying(true)
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
            {devMode && status === 'authenticated' && user ? (
              <button
                type="button"
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                  demoPlaying
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-zinc-700/60 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
                onClick={onToggleDemoPlay}
                title="Dev demo autoplay navigation"
              >
                {demoPlaying ? 'Stop Demo' : 'Play Demo'}
              </button>
            ) : null}

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

        {devMode && demoPlaying && demoSteps[demoStepIdx] ? (
          <div className="border-t border-zinc-800/90 bg-zinc-900/70 px-4 py-1.5 text-center text-[11px] text-zinc-400">
            Demo step {demoStepIdx + 1}/{demoSteps.length}: {demoSteps[demoStepIdx].label}
          </div>
        ) : null}

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
