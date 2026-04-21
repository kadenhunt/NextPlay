import { useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import { markOnboardingOpenedLeague } from '@/utils/onboardingStorage'
import LeagueProvider from '@/providers/LeagueProvider'
import StatusBadge from '@/components/StatusBadge'
import {
  canAccessDraft,
  canAccessMatchups,
  canAccessPlayers,
  canAccessStandings,
  isDraftState,
} from '@/utils/leagueGates'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'draft', label: 'Draft' },
  { key: 'team', label: 'Team' },
  { key: 'players', label: 'Players' },
  { key: 'matchups', label: 'Matchups' },
  { key: 'standings', label: 'Standings' },
  { key: 'playoffs', label: 'Playoffs' },
  { key: 'chat', label: 'Chat' },
  { key: 'settings', label: 'Settings' },
] as const

function LeagueLayoutInner() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const { status, league, error, userRole } = useLeague()
  const { devMode } = useDevMode()

  useEffect(() => {
    if (!id) return
    try {
      localStorage.setItem('nextplay.demo.lastLeagueId', id)
    } catch {
      /* noop */
    }
  }, [id])

  useEffect(() => {
    if (status !== 'ready' || !league || !user?.id) return
    markOnboardingOpenedLeague(user.id)
  }, [status, league, user?.id])

  const activeTabLabel = useMemo(() => {
    const tab = tabs.find((t) => t.key && location.pathname.endsWith(`/${t.key}`))
    if (!tab && location.pathname.includes('/league/')) return 'Matchups'
    return tab?.label ?? 'Overview'
  }, [location.pathname])

  const roleLabel = (role: string | null) => {
    if (!role) return '\u2014'
    if (role === 'COMMISSIONER') return 'Commissioner'
    return 'Member'
  }

  const tabUnavailableReason = (key: string) => {
    if (key === 'draft') return 'Available when draft opens'
    if (key === 'players') return 'Available in active stages'
    if (key === 'matchups') return 'Available after draft starts'
    if (key === 'standings') return 'Available after season data exists'
    if (key === 'playoffs') return 'Available in playoffs'
    if (key === 'settings') return 'Commissioner only'
    return 'Not available yet'
  }

  if (status === 'loading') {
    return (
      <div className="np-card p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Loading league...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
        {error ?? 'Failed to load league'}
      </div>
    )
  }

  if (!id || !league) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
        League not found.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="np-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
                {league.name}
              </h1>
              <StatusBadge state={league.state} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                Sport:{' '}
                <span className="font-medium capitalize text-zinc-800 dark:text-zinc-200">{league.sport}</span>
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">&middot;</span>
              <span>Role: {roleLabel(userRole)}</span>
              <span className="text-zinc-400 dark:text-zinc-600">&middot;</span>
              <span>Members: {league.members.length}</span>
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Current section: {activeTabLabel}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5" role="navigation" aria-label="League sections">
          {tabs.map((t) => {
            const enabled = devMode
              ? true
              : t.key === 'overview'
                ? true
                : t.key === 'draft'
                  ? canAccessDraft(league.state)
                  : t.key === 'team'
                    ? true
                    : t.key === 'players'
                      ? canAccessPlayers(league.state)
                      : t.key === 'matchups'
                        ? canAccessMatchups(league.state)
                        : t.key === 'standings'
                          ? canAccessStandings(league.state)
                          : t.key === 'playoffs'
                            ? league.state === 'PLAYOFFS' || league.state === 'COMPLETE'
                          : t.key === 'settings'
                            ? userRole === 'COMMISSIONER'
                          : (isDraftState(league.state) ||
                              league.state === 'SEASON_ACTIVE' ||
                              league.state === 'PLAYOFFS' ||
                              league.state === 'COMPLETE')

            if (!enabled) {
              return (
                <span
                  key={t.key}
                  className="cursor-not-allowed rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/[0.1] dark:text-amber-200"
                  aria-disabled="true"
                  title={tabUnavailableReason(t.key)}
                >
                  {t.label} · Locked
                </span>
              )
            }

            return (
              <NavLink
                key={t.key}
                to={`/league/${id}/${t.key}`}
                end={false}
                className={({ isActive }) =>
                  [
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50',
                    isActive
                      ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {t.label}
                    {isActive ? <span className="sr-only"> (current section)</span> : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>

      <Outlet />
    </div>
  )
}

export default function LeagueLayout() {
  return (
    <LeagueProvider>
      <LeagueLayoutInner />
    </LeagueProvider>
  )
}
