import { useEffect } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import LeagueProvider from '@/providers/LeagueProvider'
import StatusBadge from '@/components/StatusBadge'
import { getMyTeamState } from '@/services/api/nextplayApi'
import {
  canAccessDraft,
  canAccessMatchups,
  canAccessPlayers,
  canAccessStandings,
  isDraftState,
} from '@/utils/leagueGates'

const tabs = [
  { key: '', label: 'Overview' },
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

  const myTeamQuery = useQuery({
    queryKey: ['myTeamState', id, user?.id],
    queryFn: () => getMyTeamState(id!, user!.id),
    enabled: Boolean(id && user?.id && league && status === 'ready'),
  })
  const myTeamName = myTeamQuery.data?.team.name

  const roleLabel = (role: string | null) => {
    if (!role) return '\u2014'
    if (role === 'COMMISSIONER') return 'Commissioner'
    return 'Member'
  }

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{league.name}</h1>
              <StatusBadge state={league.state} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
              <span>
                Sport: <span className="font-medium text-zinc-200">{league.sport}</span>
              </span>
              <span className="text-zinc-600">&middot;</span>
              <span>Role: {roleLabel(userRole)}</span>
              <span className="text-zinc-600">&middot;</span>
              <span>Members: {league.members.length}</span>
              {myTeamName && (
                <>
                  <span className="text-zinc-600">&middot;</span>
                  <span className="font-medium text-zinc-200">
                    Your team:{' '}
                    <span className="text-zinc-100">{myTeamName}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => {
            const enabled = devMode
              ? true
              : t.key === ''
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
                  className="cursor-not-allowed rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs font-medium text-zinc-600"
                  aria-disabled="true"
                >
                  {t.label}
                </span>
              )
            }

            return (
              <NavLink
                key={t.key}
                to={t.key ? `/league/${id}/${t.key}` : `/league/${id}`}
                end={t.key === ''}
                className={({ isActive }) =>
                  [
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50',
                    isActive
                      ? 'border-red-500/30 bg-red-500/10 text-red-400'
                      : 'border-zinc-800/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200',
                  ].join(' ')
                }
              >
                {t.label}
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
