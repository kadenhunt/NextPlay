import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import { getStandings } from '@/services/api/nextplayApi'
import type { StandingRow } from '@/types/models'
import StatusBadge from '@/components/StatusBadge'
import Table from '@/components/Table'

type SortMode = 'rank' | 'wins' | 'pointsFor'

export default function StandingsPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''

  const { user } = useAuth()
  const userId = user?.id

  const { league } = useLeague()

  const [sortMode, setSortMode] = useState<SortMode>('rank')

  const standingsQuery = useQuery({
    queryKey: ['standings', leagueId, userId],
    queryFn: () => getStandings(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
  })

  const standings = standingsQuery.data ?? []

  const sortedRows = useMemo(() => {
    const rows = standings.slice()
    if (sortMode === 'rank') return rows.sort((a, b) => a.rank - b.rank)
    if (sortMode === 'wins') return rows.sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
    return rows.sort((a, b) => b.pointsFor - a.pointsFor || a.rank - b.rank)
  }, [standings, sortMode])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Standings</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              {league ? <StatusBadge state={league.state} /> : null}
              <span>Read-only standings with tie-breaker rules.</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
            >
              <option value="rank">Sort: Rank</option>
              <option value="wins">Sort: Most Wins</option>
              <option value="pointsFor">Sort: Points For</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {standingsQuery.isLoading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
              Loading standings…
            </div>
          ) : standingsQuery.isError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
              {standingsQuery.error instanceof Error ? standingsQuery.error.message : 'Failed to load standings.'}
            </div>
          ) : (
            <Table<StandingRow>
              columns={[
                {
                  key: 'rank',
                  header: 'Rank',
                  render: (r) => <span className="font-mono">{r.rank}</span>,
                  className: 'whitespace-nowrap',
                },
                {
                  key: 'team',
                  header: 'Team',
                  render: (r) => <span className="font-medium">{r.teamName}</span>,
                },
                {
                  key: 'wl',
                  header: 'W-L',
                  render: (r) => (
                    <span className="font-mono">
                      {r.wins}-{r.losses}
                    </span>
                  ),
                  className: 'whitespace-nowrap',
                },
                {
                  key: 'pf',
                  header: 'Points For',
                  render: (r) => <span className="font-mono">{r.pointsFor}</span>,
                  className: 'whitespace-nowrap',
                },
                {
                  key: 'pa',
                  header: 'Points Against',
                  render: (r) => <span className="font-mono">{r.pointsAgainst}</span>,
                  className: 'whitespace-nowrap',
                },
                {
                  key: 'delta',
                  header: '+/-',
                  render: (r) => {
                    const delta = r.pointsFor - r.pointsAgainst
                    return (
                      <span className={delta >= 0 ? 'font-mono text-emerald-400' : 'font-mono text-red-400'}>
                        {delta >= 0 ? '+' : ''}
                        {delta}
                      </span>
                    )
                  },
                  className: 'whitespace-nowrap',
                },
              ]}
              rows={sortedRows}
              getRowId={(r) => r.teamId}
              isLoading={false}
              error={null}
              emptyText="No games played yet."
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Tie-breakers</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Used when teams are tied on wins/losses and total ranking.
            </p>
            <div className="mt-3 space-y-2 text-sm text-zinc-200">
              <div>1. Head-to-head record between tied teams.</div>
              <div>2. Total cumulative fantasy points scored.</div>
              <div>3. Highest single-week fantasy point total.</div>
              <div>4. Lowest cumulative fantasy points allowed.</div>
              <div>5. Random selection if still tied.</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Integration Note</h3>
            <p className="mt-1 text-sm text-zinc-400">
              This standings panel is already wired to service calls. Replace the
              mocked API with your Java endpoints and keep the same query contract.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

