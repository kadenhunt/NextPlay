import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import {
  dropPlayerFromMyTeam,
  getMyTeamState,
  getPlayers,
  updateLineup,
  type UpdateLineupInput,
} from '@/services/api/nextplayApi'
import type { Player, PlayerId, StarterWeekScoring } from '@/types/models'
import Button from '@/components/Button'
import ScoringBreakdownPanel from '@/components/ScoringBreakdownPanel'
import StatusBadge from '@/components/StatusBadge'
import Table from '@/components/Table'

const MAX_STARTERS = 4

export default function TeamPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''

  const { user } = useAuth()
  const userId = user?.id

  const { league } = useLeague()

  const queryClient = useQueryClient()

  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)

  const teamQuery = useQuery({
    queryKey: ['myTeamState', leagueId, userId],
    queryFn: () => getMyTeamState(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
  })

  const rosterPlayersQuery = useQuery({
    queryKey: ['rosterPlayers', leagueId, userId],
    queryFn: async () => getPlayers(leagueId, userId!, { drafted: 'drafted' }),
    enabled: Boolean(leagueId && userId && teamQuery.data),
  })

  const rosterMap = useMemo(() => {
    return new Map((rosterPlayersQuery.data ?? []).map((p) => [p.id, p] as const))
  }, [rosterPlayersQuery.data])

  const rosterPlayersInTeam = useMemo(() => {
    const team = teamQuery.data?.team
    if (!team) return [] as Player[]
    return team.rosterPlayerIds.map((pid) => rosterMap.get(pid)).filter(Boolean) as Player[]
  }, [rosterMap, teamQuery.data])

  const teamState = teamQuery.data
  const isLocked = teamState?.isLineupLocked ?? true
  const starters = teamState?.team.lineup.starters ?? []

  const [starterDraft, setStarterDraft] = useState<PlayerId[]>(starters)

  useEffect(() => {
    setStarterDraft(starters)
  }, [starters.join(',')])

  const toggleStarter = (playerId: PlayerId) => {
    if (!teamState || isLocked) return
    setSaveError(null)

    const next = new Set(starterDraft)
    const isStarter = next.has(playerId)
    if (isStarter) {
      next.delete(playerId)
    } else {
      if (next.size >= MAX_STARTERS) {
        setSaveError(`You can only set up to ${MAX_STARTERS} starters.`)
        return
      }
      next.add(playerId)
    }
    setStarterDraft(Array.from(next))
  }

  const updateMutation = useMutation({
    mutationFn: async (nextStarters: PlayerId[]) => {
      if (!teamState) throw new Error('Team not loaded')

      const rosterSet = new Set(teamState.team.rosterPlayerIds)
      const startersNext = nextStarters.filter((id) => rosterSet.has(id))
      const benchNext = teamState.team.rosterPlayerIds.filter(
        (id) => !startersNext.includes(id),
      )

      const input: UpdateLineupInput = { starters: startersNext, bench: benchNext }
      return updateLineup(leagueId, userId!, input)
    },
    onSuccess: async () => {
      setSaveError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myTeamState', leagueId] }),
        queryClient.invalidateQueries({ queryKey: ['rosterPlayers', leagueId] }),
      ])
    },
    onError: (err) => setSaveError(err instanceof Error ? err.message : 'Update failed'),
  })

  const dropMutation = useMutation({
    mutationFn: (playerId: PlayerId) => dropPlayerFromMyTeam(leagueId, userId!, playerId),
    onSuccess: async () => {
      setDropError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myTeamState', leagueId] }),
        queryClient.invalidateQueries({ queryKey: ['rosterPlayers', leagueId] }),
        queryClient.invalidateQueries({ queryKey: ['players', leagueId] }),
      ])
    },
    onError: (err) => setDropError(err instanceof Error ? err.message : 'Drop failed'),
  })

  const onSave = async () => {
    if (!teamState) return
    setSaveLoading(true)
    setSaveError(null)
    try {
      await updateMutation.mutateAsync(starterDraft)
    } finally {
      setSaveLoading(false)
    }
  }

  if (teamQuery.isLoading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
        Loading roster…
      </div>
    )
  }

  if (teamQuery.isError || !teamState) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
        Failed to load your team.
      </div>
    )
  }

  const columns = [
    {
      key: 'player',
      header: 'Player',
      render: (p: Player) => (
        <div className="space-y-0.5">
          <div className="font-medium">{p.name}</div>
          <div className="text-xs text-zinc-500">
            {p.team} • {p.position}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Player) => (
        <span className="text-xs text-zinc-400">{p.status}</span>
      ),
    },
    {
      key: 'slot',
      header: 'Slot',
      render: (p: Player) => {
        const isStarter = starterDraft.includes(p.id)
        return <span className="text-sm">{isStarter ? 'Starter' : 'Bench'}</span>
      },
    },
    {
      key: 'edit',
      header: 'Edit',
      render: (p: Player) => {
        const isStarter = starterDraft.includes(p.id)
        return (
          <Button
            variant={isStarter ? 'secondary' : 'primary'}
            disabled={isLocked}
            onClick={() => toggleStarter(p.id)}
          >
            {isStarter ? 'Bench' : 'Starter'}
          </Button>
        )
      },
      className: 'whitespace-nowrap',
    },
    {
      key: 'drop',
      header: 'Drop',
      render: (p: Player) => (
        <Button
          variant="destructive"
          disabled={isLocked}
          isLoading={dropMutation.isPending}
          onClick={() => dropMutation.mutate(p.id)}
        >
          Drop
        </Button>
      ),
      className: 'whitespace-nowrap',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Fantasy team</p>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-100">{teamState.team.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              {league ? <StatusBadge state={league.state} /> : null}
              <span>
                Lineup: {isLocked ? 'Locked (read-only)' : `Unlocked (${starterDraft.length}/${MAX_STARTERS})`}
              </span>
              <span>Roster: {teamState.team.rosterPlayerIds.length}/{teamState.rosterCap}</span>
            </div>
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-sm text-amber-400">
          Lineup locked. Starters/bench are read-only.
        </div>
      ) : null}

      {teamState.weekScoring ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Scoring breakdown
              </p>
              <h3 className="mt-1 text-lg font-semibold text-zinc-100">
                Week {teamState.weekScoring.week} · Your lineup
              </h3>
              <p className="mt-1 max-w-xl text-xs text-zinc-500">
                Per player: <span className="text-zinc-400">value (#) × scoring rate → fantasy pts</span>. Your{' '}
                <span className="text-zinc-300">team score</span> is the sum of <span className="text-zinc-300">starter</span>{' '}
                totals (bench is context only). Matchups uses that same sum on the{' '}
                <span className="text-zinc-300">projected</span> side in the mock.
              </p>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">Starters</div>
                <div className="font-mono text-xl font-semibold tabular-nums text-emerald-400">
                  {teamState.weekScoring.starterTotal}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">Bench</div>
                <div className="font-mono text-lg tabular-nums text-zinc-400">
                  {teamState.weekScoring.benchTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
            <p className="text-xs font-medium text-emerald-400/90">Team points = sum of starters</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              <span className="text-zinc-500">Mock:</span> the total below is what we show as your side of the
              projected matchup on <span className="text-zinc-300">Matchups</span>.{' '}
              <span className="text-zinc-600">FR: one scoring service; no drift between Team and H2H.</span>
            </p>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                  <th className="pb-2 pr-2 font-medium">Starter</th>
                  <th className="pb-2 text-right font-medium">Fp</th>
                </tr>
              </thead>
              <tbody>
                {teamState.weekScoring.starters.map((s: StarterWeekScoring) => (
                  <tr key={s.playerId} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-2 text-zinc-200">
                      {s.playerName}{' '}
                      <span className="text-zinc-500">· {s.position}</span>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-zinc-200">
                      {s.breakdown.fantasyTotal}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="pt-3 text-zinc-100">Team score (starters)</td>
                  <td className="pt-3 text-right font-mono text-emerald-400 tabular-nums">
                    {teamState.weekScoring.starterTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Per-player stat lines</p>
            {teamState.weekScoring.starters.map((s: StarterWeekScoring) => (
              <div key={s.playerId}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-zinc-200">
                    {s.playerName}{' '}
                    <span className="font-normal text-zinc-500">· {s.position}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-zinc-400">
                    {s.breakdown.fantasyTotal} fp
                  </span>
                </div>
                <ScoringBreakdownPanel breakdown={s.breakdown} compact showFootnote={false} />
              </div>
            ))}
          </div>

          {teamState.weekScoring.bench.length > 0 ? (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium text-zinc-500">Bench (not counted in matchup)</p>
              <ul className="mt-2 space-y-1 text-xs">
                {teamState.weekScoring.bench.map((b: StarterWeekScoring) => (
                  <li key={b.playerId} className="flex justify-between gap-2 text-zinc-400">
                    <span className="text-zinc-300">{b.playerName}</span>
                    <span className="font-mono tabular-nums">{b.breakdown.fantasyTotal} fp</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {rosterPlayersQuery.isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          Loading roster players…
        </div>
      ) : (
        <Table<Player>
          columns={columns}
          rows={rosterPlayersInTeam}
          getRowId={(p) => p.id}
          isLoading={false}
          error={null}
          emptyText="Your roster is empty."
        />
      )}

      {saveError ? (
        <div className="rounded-md border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-400">
          {saveError}
        </div>
      ) : null}
      {dropError ? (
        <div className="rounded-md border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-400">
          {dropError}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isLocked || saveLoading}
          isLoading={saveLoading || updateMutation.isPending}
        >
          Save lineup
        </Button>
      </div>
    </div>
  )
}

