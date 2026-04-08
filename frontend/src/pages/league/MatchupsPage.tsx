import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import type { Matchup, MatchupSideLineupScoring, Player } from '@/types/models'
import {
  getMatchupInsight,
  getMatchupLineupScoring,
  getMatchupMessages,
  getMatchups,
  getPlayers,
  postMatchupMessage,
} from '@/services/api/nextplayApi'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import ScoringBreakdownPanel from '@/components/ScoringBreakdownPanel'
import StatusBadge from '@/components/StatusBadge'

const WEEKS = [1, 2, 3, 4] as const

function MatchupStatusPill({ status }: { status: Matchup['status'] }) {
  const label = status === 'LIVE' ? 'In progress' : status === 'UPCOMING' ? 'Upcoming' : 'Final'
  const styles =
    status === 'FINAL'
      ? 'border-zinc-300 bg-zinc-200 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300'
      : status === 'LIVE'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
        : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${styles}`}>
      {label}
    </span>
  )
}

function MatchupSideScoringColumn({
  side,
  badge,
  playerById,
}: {
  side: MatchupSideLineupScoring
  badge: string
  playerById: Map<string, Player>
}) {
  const ecrMap = new Map(
    [...side.starters]
      .sort(
        (a, b) =>
          (playerById.get(b.playerId)?.projectedPoints ?? 0) -
          (playerById.get(a.playerId)?.projectedPoints ?? 0),
      )
      .map((s, idx) => [s.playerId, idx + 1]),
  )

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-100/90 p-3 dark:border-zinc-800/90 dark:bg-zinc-950/35">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800/70">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{badge}</div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{side.teamName}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Team (starters)</div>
          <div className="font-mono text-lg tabular-nums text-emerald-600 dark:text-emerald-400">
            {side.starterTotal}
          </div>
        </div>
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            <th className="pb-1.5 font-medium">Stats</th>
            <th className="pb-1.5 font-medium">Player</th>
            <th className="pb-1.5 text-right font-medium">ECR</th>
            <th className="pb-1.5 text-right font-medium">FP</th>
            <th className="pb-1.5 text-right font-medium">Proj</th>
            <th className="pb-1.5 text-right font-medium">Fan Pts</th>
          </tr>
        </thead>
        <tbody>
          {side.starters.map((s) => (
            <tr key={s.playerId} className="border-b border-zinc-200/90 dark:border-zinc-800/40">
              <td className="py-1.5 pr-2 text-zinc-500 dark:text-zinc-500">
                {playerById.get(s.playerId)?.team ?? '—'} · {s.position}
              </td>
              <td className="py-1.5 pr-2 text-zinc-800 dark:text-zinc-200">{s.playerName}</td>
              <td className="py-1.5 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                {ecrMap.get(s.playerId) ?? '—'}
              </td>
              <td className="py-1.5 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                {s.breakdown.isProjected ? '—' : s.breakdown.fantasyTotal}
              </td>
              <td className="py-1.5 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                {playerById.get(s.playerId)?.projectedPoints ?? '—'}
              </td>
              <td className="py-1.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                {s.breakdown.fantasyTotal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Stat lines → Fp</div>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-0.5">
        {side.starters.map((s) => (
          <div key={`${s.playerId}-lines`}>
            <div className="mb-0.5 truncate text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{s.playerName}</div>
            <ScoringBreakdownPanel breakdown={s.breakdown} compact showFootnote={false} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MatchupsPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''

  const { user } = useAuth()
  const userId = user?.id

  const { league } = useLeague()
  const queryClient = useQueryClient()

  const [week, setWeek] = useState<(typeof WEEKS)[number]>(1)
  const [selectedMatchupId, setSelectedMatchupId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [matchupText, setMatchupText] = useState('')
  const [matchupBanner, setMatchupBanner] = useState<string | null>(null)

  const matchupsQuery = useQuery({
    queryKey: ['matchups', leagueId, userId, week],
    queryFn: () => getMatchups(leagueId, userId!, week),
    enabled: Boolean(leagueId && userId && league),
  })

  const matchups = matchupsQuery.data ?? []

  const selectedMatchup = useMemo(() => {
    if (!selectedMatchupId) return null
    return matchups.find((m) => m.id === selectedMatchupId) ?? null
  }, [matchups, selectedMatchupId])
  const finalsCount = useMemo(
    () => matchups.filter((m) => m.status === 'FINAL').length,
    [matchups],
  )

  const matchupMessagesQuery = useQuery({
    queryKey: ['matchupMessages', leagueId, userId, selectedMatchupId],
    queryFn: () => getMatchupMessages(leagueId, userId!, selectedMatchupId!),
    enabled: Boolean(leagueId && userId && selectedMatchupId && detailOpen),
  })

  const matchupInsightQuery = useQuery({
    queryKey: ['matchupInsight', leagueId, userId, selectedMatchupId],
    queryFn: () => getMatchupInsight(leagueId, userId!, selectedMatchupId!),
    enabled: Boolean(leagueId && userId && selectedMatchupId && detailOpen),
  })

  const matchupLineupQuery = useQuery({
    queryKey: ['matchupLineupScoring', leagueId, userId, selectedMatchupId],
    queryFn: () => getMatchupLineupScoring(leagueId, userId!, selectedMatchupId!),
    enabled: Boolean(leagueId && userId && selectedMatchupId && detailOpen && league),
  })

  const matchupPlayersQuery = useQuery({
    queryKey: ['matchupPlayersLookup', leagueId, userId],
    queryFn: () => getPlayers(leagueId, userId!, { drafted: 'drafted', sort: 'projectedPoints_desc' }),
    enabled: Boolean(leagueId && userId && detailOpen),
  })

  const matchupPlayerById = useMemo(
    () => new Map((matchupPlayersQuery.data ?? []).map((p) => [p.id, p] as const)),
    [matchupPlayersQuery.data],
  )

  const messageMutation = useMutation({
    mutationFn: () => postMatchupMessage(leagueId, userId!, selectedMatchupId!, matchupText),
    onSuccess: async () => {
      setMatchupText('')
      setMatchupBanner('Message sent.')
      await queryClient.invalidateQueries({ queryKey: ['matchupMessages', leagueId, userId, selectedMatchupId] })
    },
    onError: (err) => setMatchupBanner(err instanceof Error ? err.message : 'Unable to send message'),
  })

  const boardAccessDenied =
    matchupMessagesQuery.isError &&
    matchupMessagesQuery.error instanceof Error &&
    matchupMessagesQuery.error.message.toLowerCase().includes('weekly opponents')

  const openDetails = (matchupId: string) => {
    setSelectedMatchupId(matchupId)
    setDetailOpen(true)
    setMatchupText('')
    setMatchupBanner(null)
  }

  if (!league) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="np-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">Matchups</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <StatusBadge state={league.state} />
              <span>Weekly matchup results.</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {WEEKS.map((w) => (
              <Button
                key={w}
                variant={w === week ? 'primary' : 'secondary'}
                onClick={() => setWeek(w)}
              >
                Week {w}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="np-card-inset px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Selected Week</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Week {week}</div>
          </div>
          <div className="np-card-inset px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Matchups</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{matchups.length}</div>
          </div>
          <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-red-400/80">Finals Posted</div>
            <div className="text-lg font-semibold text-red-400">{finalsCount}</div>
          </div>
        </div>
      </div>

      {matchupsQuery.isLoading ? (
        <div className="np-card p-6 text-sm text-zinc-600 dark:text-zinc-400">
          Loading matchups…
        </div>
      ) : matchupsQuery.isError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
          {matchupsQuery.error instanceof Error ? matchupsQuery.error.message : 'Failed to load matchups.'}
        </div>
      ) : matchups.length === 0 ? (
        <div className="np-card p-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
          No matchups found for Week {week}.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matchups.map((m) => {
            const isFinal = m.status === 'FINAL'
            const homePts = isFinal ? m.homeScore : m.homeProjected
            const awayPts = isFinal ? m.awayScore : m.awayProjected
            const homeLead =
              homePts != null && awayPts != null ? homePts > awayPts : false
            const awayLead =
              homePts != null && awayPts != null ? awayPts > homePts : false
            const tie =
              homePts != null && awayPts != null && homePts === awayPts

            return (
              <div
                key={m.id}
                className="group rounded-xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-100 p-5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950/80 dark:hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <MatchupStatusPill status={m.status} />
                  <Button type="button" variant="secondary" onClick={() => openDetails(m.id)}>
                    View
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                  <div className="min-w-0 text-center sm:text-right">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Home</div>
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{m.homeTeamName}</div>
                    <div className="mt-2 space-y-0.5">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Proj</div>
                      <div className="font-mono text-lg tabular-nums text-zinc-700 dark:text-zinc-300">{m.homeProjected ?? '—'}</div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Actual</div>
                      <div className={`font-mono text-2xl font-semibold tabular-nums ${tie ? 'text-zinc-800 dark:text-zinc-200' : homeLead ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {m.homeScore ?? '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-6 text-zinc-500 dark:text-zinc-600">
                    <span className="text-xs font-bold tracking-widest">VS</span>
                    {!isFinal && m.homeProjected != null && m.awayProjected != null ? (
                      <span className="mt-1 whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-500">
                        Σ {Math.round((m.homeProjected + m.awayProjected) * 10) / 10}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 text-center sm:text-left">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Away</div>
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{m.awayTeamName}</div>
                    <div className="mt-2 space-y-0.5">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Proj</div>
                      <div className="font-mono text-lg tabular-nums text-zinc-700 dark:text-zinc-300">{m.awayProjected ?? '—'}</div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Actual</div>
                      <div className={`font-mono text-2xl font-semibold tabular-nums ${tie ? 'text-zinc-800 dark:text-zinc-200' : awayLead ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {m.awayScore ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {isFinal &&
                m.homeProjected != null &&
                m.awayProjected != null &&
                (m.homeScore != null || m.awayScore != null) ? (
                  <div className="mt-3 border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-500">
                    Pre-game projection:{' '}
                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                      {m.homeProjected} — {m.awayProjected}
                    </span>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={detailOpen}
        title="Matchup Details"
        panelClassName="max-w-4xl"
        onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedMatchup ? (
          <div className="max-h-[min(75vh,760px)] space-y-4 overflow-y-auto pr-1 text-sm">
            <div>
              <div className="text-base font-semibold">
                {selectedMatchup.homeTeamName} vs {selectedMatchup.awayTeamName}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Week {selectedMatchup.week} • Status: {selectedMatchup.status}
              </div>
            </div>

            {selectedMatchup.status === 'FINAL' ? (
              <div className="rounded-md border border-zinc-700/60 bg-zinc-900/80 p-3">
                {(() => {
                  const home = selectedMatchup.homeScore ?? 0
                  const away = selectedMatchup.awayScore ?? 0
                  const homeLead = home >= away
                  const awayLead = away >= home
                  return (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className={homeLead ? 'text-emerald-400' : 'text-red-400'}>
                          {selectedMatchup.homeTeamName}
                        </span>
                        <span className="font-mono">{home}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className={awayLead ? 'text-emerald-400' : 'text-red-400'}>
                          {selectedMatchup.awayTeamName}
                        </span>
                        <span className="font-mono">{away}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : selectedMatchup.homeProjected != null && selectedMatchup.awayProjected != null ? (
              <div className="rounded-md border border-zinc-700/60 bg-zinc-900/80 p-3">
                <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">Projected (pre-result)</div>
                {(() => {
                  const home = selectedMatchup.homeProjected!
                  const away = selectedMatchup.awayProjected!
                  const homeLead = home >= away
                  const awayLead = away >= home
                  return (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className={homeLead ? 'text-emerald-400' : 'text-red-400'}>
                          {selectedMatchup.homeTeamName}
                        </span>
                        <span className="font-mono">{home}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className={awayLead ? 'text-emerald-400' : 'text-red-400'}>
                          {selectedMatchup.awayTeamName}
                        </span>
                        <span className="font-mono">{away}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="rounded-md border border-zinc-700/60 bg-zinc-900/80 p-3 text-zinc-600 dark:text-zinc-400">
                This matchup is not finalized yet.
              </div>
            )}

            <div className="np-card p-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Point summary</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                Uses starter totals with projection and current fantasy points in one table.
              </p>
              {matchupLineupQuery.isLoading ? (
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">Loading lineup scoring…</div>
              ) : matchupLineupQuery.isError ? (
                <div className="mt-3 text-xs text-red-400">
                  {matchupLineupQuery.error instanceof Error
                    ? matchupLineupQuery.error.message
                    : 'Could not load scoring.'}
                </div>
              ) : matchupLineupQuery.data ? (
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <MatchupSideScoringColumn side={matchupLineupQuery.data.home} badge="Home" playerById={matchupPlayerById} />
                  <MatchupSideScoringColumn side={matchupLineupQuery.data.away} badge="Away" playerById={matchupPlayerById} />
                </div>
              ) : null}
              {selectedMatchup.status === 'FINAL' ? (
                <p className="mt-3 text-[10px] text-zinc-600">
                  Final scores at the top are locked results; grids below use current roster projections (mock).
                </p>
              ) : null}
            </div>

            <div className="np-card p-3">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Predictive Insight</h4>
              {matchupInsightQuery.data ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div className="np-inset-xs p-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Home win: <span className="font-mono text-emerald-400">{matchupInsightQuery.data.homeWinProbability}%</span>
                  </div>
                  <div className="np-inset-xs p-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Away win: <span className="font-mono text-red-400">{matchupInsightQuery.data.awayWinProbability}%</span>
                  </div>
                  <div className="np-inset-xs p-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Total: <span className="font-mono">{matchupInsightQuery.data.projectedTotal}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Insight unavailable for this matchup.</p>
              )}
            </div>

            <div className="np-card p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Matchup Message Board</h4>
                {matchupBanner ? <span className="text-xs text-emerald-400">{matchupBanner}</span> : null}
              </div>
              {boardAccessDenied ? (
                <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-400">
                  This matchup board is limited to the weekly opponents and commissioner.
                </div>
              ) : (
                <>
                  <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
                    {(matchupMessagesQuery.data ?? []).length ? (
                      (matchupMessagesQuery.data ?? []).map((m) => (
                        <div key={m.id} className="np-inset-xs px-2 py-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{m.displayName}</span>
                            <span className="text-[11px] text-zinc-600">{new Date(m.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">No messages yet for this matchup.</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <textarea
                      className="min-h-[72px] w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition focus:border-red-500/60"
                      value={matchupText}
                      onChange={(e) => setMatchupText(e.target.value)}
                      placeholder="Message your weekly opponent..."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={() => messageMutation.mutate()}
                        disabled={!matchupText.trim()}
                        isLoading={messageMutation.isPending}
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">No matchup selected.</div>
        )}
      </Modal>
    </div>
  )
}


