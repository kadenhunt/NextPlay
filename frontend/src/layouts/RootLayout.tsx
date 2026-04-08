import { useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import TopTicker from '@/components/TopTicker'
import DevModeToggle from '@/components/DevModeToggle'
import HeaderBrandLogo from '@/components/HeaderBrandLogo'
import ThemeToggle from '@/components/ThemeToggle'
import { listMyLeagues } from '@/services/api/nextplayApi'
import { canAccessDevModeToggle } from '@/utils/devAccess'

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
      { path: '/dashboard', waitMs: 4600, label: 'Dashboard' },
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

  const showDevChrome = canAccessDevModeToggle(user?.email)

  const headerBtn =
    'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-200">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 shadow-sm shadow-zinc-900/[0.03] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/20">
        <div className="mx-auto flex w-full max-w-[1600px] items-end justify-between gap-3 px-6 pb-2 pt-2">
          <HeaderBrandLogo />

          <div className="flex flex-wrap items-end justify-end gap-2">
            <ThemeToggle />
            {status === 'authenticated' && user ? (
              <Link to="/notifications" className={headerBtn}>
                Notifications
              </Link>
            ) : null}
            {status === 'authenticated' && user ? (
              <Link to="/settings/account" className={headerBtn}>
                Account
              </Link>
            ) : null}
            {showDevChrome ? <DevModeToggle /> : null}
            {showDevChrome && devMode && status === 'authenticated' && user ? (
              <button
                type="button"
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                  demoPlaying
                    ? 'border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300'
                    : headerBtn
                }`}
                onClick={onToggleDemoPlay}
                title="Dev demo autoplay navigation"
              >
                {demoPlaying ? 'Stop Demo' : 'Play Demo'}
              </button>
            ) : null}

            {status === 'authenticated' && user ? (
              <button type="button" className={headerBtn} onClick={onLogout}>
                Logout
              </button>
            ) : (
              <div className="pb-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                {status === 'loading' ? 'Loading...' : ''}
              </div>
            )}
          </div>
        </div>

        {showDevChrome && devMode && demoPlaying && demoSteps[demoStepIdx] ? (
          <div className="border-t border-zinc-200 bg-zinc-50/90 px-4 py-1.5 text-center text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            Demo step {demoStepIdx + 1}/{demoSteps.length}: {demoSteps[demoStepIdx].label}
          </div>
        ) : null}
      </header>

      <TopTicker userId={user?.id} />

      <main
        id="main-content"
        className="animate-fade-up mx-auto w-full max-w-[1600px] flex-1 px-6 py-8"
      >
        {children}
        <Outlet />
      </main>
      <footer className="mt-auto border-t border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="font-display tracking-wide text-zinc-700 dark:text-zinc-300">NextPlay</span>
            <span className="font-display tracking-wide text-zinc-700 dark:text-zinc-300">
              Draft. Compete. Dominate.
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} NextPlay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
