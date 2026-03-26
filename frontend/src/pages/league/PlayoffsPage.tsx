import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import { getPlayoffBracket } from '@/services/api/nextplayApi'
import StatusBadge from '@/components/StatusBadge'

export default function PlayoffsPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''
  const { user } = useAuth()
  const userId = user?.id
  const { league } = useLeague()

  const playoffsQuery = useQuery({
    queryKey: ['playoffs', leagueId, userId],
    queryFn: () => getPlayoffBracket(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
  })

  const semifinals = useMemo(
    () => (playoffsQuery.data ?? []).filter((m) => m.round === 'Semifinal'),
    [playoffsQuery.data],
  )
  const final = useMemo(
    () => (playoffsQuery.data ?? []).find((m) => m.round === 'Final') ?? null,
    [playoffsQuery.data],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Playoffs</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Bracket view for top-seeded teams, progressed from finalized weekly matchup data.
            </p>
          </div>
          {league ? <StatusBadge state={league.state} /> : null}
        </div>
      </div>

      {playoffsQuery.isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          Loading playoffs...
        </div>
      ) : playoffsQuery.isError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
          {playoffsQuery.error instanceof Error ? playoffsQuery.error.message : 'Unable to load playoffs'}
        </div>
      ) : (playoffsQuery.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          Playoffs are not available yet for this league.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Semifinals</h3>
            <div className="mt-3 space-y-3">
              {semifinals.map((m) => (
                <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <div className="text-xs text-zinc-500">#{m.seedA} vs #{m.seedB}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={m.winner === m.teamA ? 'text-emerald-400' : 'text-zinc-200'}>
                      {m.teamA}
                    </span>
                    <span className="font-mono">{m.scoreA ?? '—'}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={m.winner === m.teamB ? 'text-emerald-400' : 'text-zinc-200'}>
                      {m.teamB}
                    </span>
                    <span className="font-mono">{m.scoreB ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Championship</h3>
            {final ? (
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className={final.winner === final.teamA ? 'text-emerald-400' : 'text-zinc-200'}>
                    {final.teamA}
                  </span>
                  <span className="font-mono">{final.scoreA ?? '—'}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={final.winner === final.teamB ? 'text-emerald-400' : 'text-zinc-200'}>
                    {final.teamB}
                  </span>
                  <span className="font-mono">{final.scoreB ?? '—'}</span>
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Champion: <span className="font-medium text-zinc-200">{final.winner ?? 'TBD'}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

