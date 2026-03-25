import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useLeague } from '@/providers/LeagueProvider'
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
  const { status, league, error, userRole } = useLeague()

  const roleLabel = (role: string | null) => {
    if (!role) return '—'
    if (role === 'COMMISSIONER') return 'Commissioner'
    return 'Member'
  }

  if (status === 'loading') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-slate-900 dark:text-gray-400">
        Loading league…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
        {error ?? 'Failed to load league'}
      </div>
    )
  }

  if (!id || !league) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
        League not found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
              <StatusBadge state={league.state} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
              <span>
                Sport: <span className="font-medium text-slate-200">{league.sport}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span>Role: {roleLabel(userRole)}</span>
              <span className="text-slate-500">•</span>
              <span>Members: {league.members.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const enabled =
              t.key === ''
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
                        : // chat: show only during draft/season
                          (isDraftState(league.state) ||
                            league.state === 'SEASON_ACTIVE' ||
                            league.state === 'PLAYOFFS' ||
                            league.state === 'COMPLETE')

            // Handoff note: this mapping mirrors league-state access rules from SRS/SDD.
            // If backend policy changes, update this single map before touching screen components.
            if (!enabled) {
              return (
                <span
                  key={t.key}
                  className="cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-500 opacity-60"
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
                    'rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60',
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
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

