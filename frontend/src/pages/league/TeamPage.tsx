import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import {
  dropPlayerFromMyTeam,
  getMatchupLineupScoring,
  getMatchups,
  getMyTeamState,
  getPlayers,
  updateLineup,
  type UpdateLineupInput,
} from '@/services/api/nextplayApi'
import type { Player, PlayerId, StarterWeekScoring } from '@/types/models'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
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
  const [brandOpen, setBrandOpen] = useState(false)
  const [teamNameDraft, setTeamNameDraft] = useState('')
  const [teamIconDraft, setTeamIconDraft] = useState('🏆')
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [selectedCompareMatchupId, setSelectedCompareMatchupId] = useState<string | null>(null)

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

  const teamState = teamQuery.data
  const isLocked = teamState?.isLineupLocked ?? true
  const starters = useMemo(
    () => teamState?.team.lineup.starters ?? [],
    [teamState?.team.lineup.starters],
  )

  const teamBrandKey = `nextplay.team.brand.${leagueId}.${teamState?.team.id ?? 'unknown'}`
  const teamBrand = useMemo(() => {
    try {
      const raw = localStorage.getItem(teamBrandKey)
      if (!raw) return null
      return JSON.parse(raw) as { name?: string; icon?: string; imageData?: string }
    } catch {
      return null
    }
  }, [teamBrandKey])

  const matchupsWeek1Query = useQuery({
    queryKey: ['teamCompareMatchups', leagueId, userId],
    queryFn: () => getMatchups(leagueId, userId!, 1),
    enabled: Boolean(leagueId && userId && league && teamState),
  })

  const compareMatchup = useMemo(
    () => (matchupsWeek1Query.data ?? []).find((m) => m.id === selectedCompareMatchupId) ?? null,
    [matchupsWeek1Query.data, selectedCompareMatchupId],
  )

  const compareScoringQuery = useQuery({
    queryKey: ['teamCompareScoring', leagueId, userId, selectedCompareMatchupId],
    queryFn: () => getMatchupLineupScoring(leagueId, userId!, selectedCompareMatchupId!),
    enabled: Boolean(leagueId && userId && selectedCompareMatchupId && comparisonOpen),
  })

  const rosterMap = useMemo(() => {
    return new Map((rosterPlayersQuery.data ?? []).map((p) => [p.id, p] as const))
  }, [rosterPlayersQuery.data])

  const rosterPlayersInTeam = useMemo(() => {
    const team = teamQuery.data?.team
    if (!team) return [] as Player[]
    return team.rosterPlayerIds.map((pid) => rosterMap.get(pid)).filter(Boolean) as Player[]
  }, [rosterMap, teamQuery.data])

  const [starterDraft, setStarterDraft] = useState<PlayerId[]>(starters)

  useEffect(() => {
    setStarterDraft(starters)
  }, [starters])

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

  const onOpenBrand = () => {
    if (!teamState) return
    setTeamNameDraft(teamBrand?.name ?? teamState.team.name)
    setTeamIconDraft(teamBrand?.icon ?? '🏆')
    setUploadPreview(teamBrand?.imageData ?? null)
    setBrandOpen(true)
  }

  const onSaveBrand = () => {
    if (!teamState) return
    try {
      localStorage.setItem(
        teamBrandKey,
        JSON.stringify({
          name: teamNameDraft.trim() || teamState.team.name,
          icon: teamIconDraft,
          imageData: uploadPreview,
        }),
      )
    } catch {
      /* noop */
    }
    setBrandOpen(false)
  }

  if (teamQuery.isLoading) {
    return (
      <div className="np-card p-6 text-sm text-zinc-600 dark:text-zinc-400">
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
          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            {p.team} • {p.position}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Player) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{p.status}</span>
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
      <div className="np-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Fantasy team</p>
            <h2 className="mt-0.5 font-display text-2xl font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
              {teamBrand?.imageData ? (
                <img src={teamBrand.imageData} alt="" className="mr-2 inline-block h-8 w-8 rounded object-cover align-middle" />
              ) : (
                <span className="mr-2 align-middle">{teamBrand?.icon ?? '🏆'}</span>
              )}
              <span className="align-middle">{teamBrand?.name ?? teamState.team.name}</span>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {league ? <StatusBadge state={league.state} /> : null}
              <span>
                Lineup: {isLocked ? 'Locked' : `Unlocked ${starterDraft.length}/${MAX_STARTERS}`}
              </span>
              <span>Roster: {teamState.team.rosterPlayerIds.length}/{teamState.rosterCap}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onOpenBrand}>Customize Team</Button>
            <Button
              variant="secondary"
              onClick={() => {
                const myMatchup = (matchupsWeek1Query.data ?? []).find(
                  (m) => m.homeTeamId === teamState.team.id || m.awayTeamId === teamState.team.id,
                )
                if (myMatchup) {
                  setSelectedCompareMatchupId(myMatchup.id)
                }
                setComparisonOpen(true)
              }}
            >
              Compare vs Opponent
            </Button>
          </div>
        </div>
      </div>

      {teamState.weekScoring ? (
        <div className="np-card p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                Point summary
              </p>
              <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Week {teamState.weekScoring.week} · Your lineup
              </h3>
              <p className="mt-1 max-w-xl text-xs text-zinc-500 dark:text-zinc-500">
                Starter totals drive your matchup score. Bench points are shown for context.
              </p>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Starters</div>
                <div className="font-mono text-xl font-semibold tabular-nums text-emerald-400">
                  {teamState.weekScoring.starterTotal}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Bench</div>
                <div className="font-mono text-lg tabular-nums text-zinc-600 dark:text-zinc-400">
                  {teamState.weekScoring.benchTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
            <p className="text-xs font-medium text-emerald-400/90">Point summary</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
              This total is the value used for your side in matchup views.
            </p>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  <th className="pb-2 pr-2 font-medium">Starter</th>
                  <th className="pb-2 text-right font-medium">Fp</th>
                </tr>
              </thead>
              <tbody>
                {teamState.weekScoring.starters.map((s: StarterWeekScoring) => (
                  <tr key={s.playerId} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-2 text-zinc-800 dark:text-zinc-200">
                      {s.playerName}{' '}
                      <span className="text-zinc-500 dark:text-zinc-500">· {s.position}</span>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                      {s.breakdown.fantasyTotal}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="pt-3 text-zinc-900 dark:text-zinc-100">Team score (starters)</td>
                  <td className="pt-3 text-right font-mono text-emerald-400 tabular-nums">
                    {teamState.weekScoring.starterTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Per-player stat lines</p>
            {teamState.weekScoring.starters.map((s: StarterWeekScoring) => (
              <div key={s.playerId}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {s.playerName}{' '}
                    <span className="font-normal text-zinc-500 dark:text-zinc-500">· {s.position}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                    {s.breakdown.fantasyTotal} fp
                  </span>
                </div>
                <ScoringBreakdownPanel breakdown={s.breakdown} compact showFootnote={false} />
              </div>
            ))}
          </div>

          {teamState.weekScoring.bench.length > 0 ? (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Bench (not counted in matchup)</p>
              <ul className="mt-2 space-y-1 text-xs">
                {teamState.weekScoring.bench.map((b: StarterWeekScoring) => (
                  <li key={b.playerId} className="flex justify-between gap-2 text-zinc-600 dark:text-zinc-400">
                    <span className="text-zinc-700 dark:text-zinc-300">{b.playerName}</span>
                    <span className="font-mono tabular-nums">{b.breakdown.fantasyTotal} fp</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {rosterPlayersQuery.isLoading ? (
        <div className="np-card p-6 text-sm text-zinc-600 dark:text-zinc-400">
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

      <Modal
        open={brandOpen}
        title="Customize Team"
        onClose={() => setBrandOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBrandOpen(false)}>Cancel</Button>
            <Button onClick={onSaveBrand}>Save</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Team display name"
            value={teamNameDraft}
            onChange={(e) => setTeamNameDraft(e.target.value)}
            placeholder="Your team name"
          />
          <div className="space-y-1">
            <label htmlFor="team-icon" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preset icon</label>
            <select
              id="team-icon"
              value={teamIconDraft}
              onChange={(e) => setTeamIconDraft(e.target.value)}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm"
            >
              <option value="🏆">🏆 Trophy</option>
              <option value="🔥">🔥 Fire</option>
              <option value="⚡">⚡ Bolt</option>
              <option value="🦅">🦅 Eagle</option>
              <option value="🛡️">🛡️ Shield</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="team-logo-upload" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upload team image (optional)</label>
            <input
              id="team-logo-upload"
              type="file"
              accept="image/*"
              className="w-full text-sm text-zinc-600 dark:text-zinc-400"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') setUploadPreview(reader.result)
                }
                reader.readAsDataURL(file)
              }}
            />
            {uploadPreview ? (
              <img src={uploadPreview} alt="Team upload preview" className="h-16 w-16 rounded object-cover" />
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={comparisonOpen}
        title="Team Comparison"
        onClose={() => setComparisonOpen(false)}
        panelClassName="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setComparisonOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="compare-matchup" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Matchup</label>
            <select
              id="compare-matchup"
              value={selectedCompareMatchupId ?? ''}
              onChange={(e) => setSelectedCompareMatchupId(e.target.value || null)}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm"
            >
              <option value="">Select matchup</option>
              {(matchupsWeek1Query.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeamName} vs {m.awayTeamName} (Week {m.week})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Last updated:{' '}
            {compareScoringQuery.dataUpdatedAt
              ? new Date(compareScoringQuery.dataUpdatedAt).toLocaleString()
              : '—'}
          </p>
          {compareScoringQuery.isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading comparison...</p>
          ) : compareScoringQuery.data && compareMatchup ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-100/90 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{compareScoringQuery.data.home.teamName}</div>
                <div className="mt-1 font-mono text-2xl text-emerald-400">{compareScoringQuery.data.home.starterTotal}</div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-100/90 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{compareScoringQuery.data.away.teamName}</div>
                <div className="mt-1 font-mono text-2xl text-emerald-400">{compareScoringQuery.data.away.starterTotal}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Choose a matchup to compare lineups.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

