import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import {
  addPlayerToMyTeam,
  getPlayerById,
  getPlayerInsights,
  getPlayers,
  type PlayerQuery,
} from '@/services/api/nextplayApi'
import type { Player, PlayerId, PlayerStatus } from '@/types/models'
import { PlayerStatus as PlayerStatusValues } from '@/types/models'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import ScoringBreakdownPanel from '@/components/ScoringBreakdownPanel'
import StatusBadge from '@/components/StatusBadge'
import Table from '@/components/Table'

const filterSelectClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-red-500/70 dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-100'

export default function PlayersPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''

  const { user } = useAuth()
  const userId = user?.id

  const { league } = useLeague()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')
  const [team, setTeam] = useState('')
  const [status, setStatus] = useState<PlayerStatus | 'any'>('any')
  const [drafted, setDrafted] = useState<PlayerQuery['drafted']>('available')
  const [sort, setSort] = useState<PlayerQuery['sort']>('projectedPoints_desc')
  const [savedFilterName, setSavedFilterName] = useState('')
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; query: PlayerQuery; updatedAt: string }>>([])

  const [selectedPlayerId, setSelectedPlayerId] = useState<PlayerId | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [pickupBanner, setPickupBanner] = useState<string | null>(null)
  const filtersStorageKey = `nextplay.players.filters.${leagueId}.${userId ?? 'anon'}`
  const playerFacetsQueryKey = ['playerFacets', leagueId, userId] as const
  const playerQueryKey = ['players', leagueId, userId, search, position, team, status, drafted, sort] as const

  const query: PlayerQuery = useMemo(
    () => ({
      search,
      position: position || undefined,
      team: team || undefined,
      status: status === 'any' ? undefined : status,
      drafted,
      sort,
    }),
    [drafted, position, search, sort, status, team],
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(filtersStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Array<{ name: string; query: PlayerQuery; updatedAt: string }>
      startTransition(() => {
        setSavedFilters(parsed)
      })
    } catch {
      /* noop */
    }
  }, [filtersStorageKey])

  useEffect(() => {
    try {
      localStorage.setItem(filtersStorageKey, JSON.stringify(savedFilters))
    } catch {
      /* noop */
    }
  }, [filtersStorageKey, savedFilters])

  const facetsQuery = useQuery({
    queryKey: playerFacetsQueryKey,
    queryFn: () => getPlayers(leagueId, userId!, { drafted: 'any', sort: 'name_asc' }),
    enabled: Boolean(leagueId && userId && league),
  })

  const playersQuery = useQuery({
    queryKey: playerQueryKey,
    queryFn: () => getPlayers(leagueId, userId!, query),
    enabled: Boolean(leagueId && userId && league),
  })

  const players = useMemo(() => playersQuery.data ?? [], [playersQuery.data])

  const selectedPlayer: Player | null = useMemo(() => {
    if (!selectedPlayerId) return null
    return players.find((p) => p.id === selectedPlayerId) ?? null
  }, [players, selectedPlayerId])

  const insightsQuery = useQuery({
    queryKey: ['playerInsights', leagueId, userId],
    queryFn: () => getPlayerInsights(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
  })

  const shouldFetchPlayerDetail = Boolean(
    leagueId &&
      userId &&
      selectedPlayerId &&
      detailOpen &&
      league &&
      !(league.sport === 'football' && selectedPlayer),
  )

  const playerDetailQuery = useQuery({
    queryKey: ['player', leagueId, userId, selectedPlayerId],
    queryFn: () => getPlayerById(leagueId, userId!, selectedPlayerId!),
    enabled: shouldFetchPlayerDetail,
  })

  const positions = useMemo(() => {
    const set = new Set((facetsQuery.data ?? []).map((p) => p.position))
    return Array.from(set).sort()
  }, [facetsQuery.data])

  const teams = useMemo(() => {
    const set = new Set((facetsQuery.data ?? []).map((p) => p.team))
    return Array.from(set).sort()
  }, [facetsQuery.data])

  const insightByPlayerId = useMemo(
    () => new Map((insightsQuery.data ?? []).map((i) => [i.playerId, i])),
    [insightsQuery.data],
  )

  const topInsightPlayers = useMemo(
    () => players.slice().sort((a, b) => b.projectedPoints - a.projectedPoints).slice(0, 3),
    [players],
  )

  const openDetails = useCallback((playerId: PlayerId) => {
    setSelectedPlayerId(playerId)
    setDetailOpen(true)
  }, [])

  const getPlayerRowId = useCallback((player: Player) => player.id, [])

  const addMutation = useMutation({
    mutationFn: (playerId: PlayerId) => addPlayerToMyTeam(leagueId, userId!, playerId),
    onSuccess: async (_teamState, playerId) => {
      setPickupBanner('Player added to your roster.')
      queryClient.setQueryData<Player[]>(playerQueryKey, (current) =>
        current ? current.filter((player) => player.id !== playerId) : current,
      )
      queryClient.setQueryData<Player[]>(playerFacetsQueryKey, (current) =>
        current
          ? current.map((player) =>
              player.id === playerId ? { ...player, drafted: true } : player,
            )
          : current,
      )
      if (selectedPlayerId === playerId) {
        queryClient.setQueryData<Player | undefined>(
          ['player', leagueId, userId, playerId],
          (current) => (current ? { ...current, drafted: true } : current),
        )
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myTeamState', leagueId] }),
        queryClient.invalidateQueries({ queryKey: ['rosterPlayers', leagueId] }),
      ])
    },
    onError: (err) => setPickupBanner(err instanceof Error ? err.message : 'Unable to add player'),
  })

  const tableColumns = useMemo(
    () => [
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
        key: 'proj',
        header: 'Proj',
        render: (p: Player) => <span className="font-mono">{p.projectedPoints}</span>,
        className: 'whitespace-nowrap',
      },
      {
        key: 'pickup',
        header: 'Pickup',
        render: (p: Player) =>
          p.drafted ? (
            <span className="text-xs text-zinc-600">Unavailable</span>
          ) : (
            <Button
              type="button"
              onClick={() => addMutation.mutate(p.id)}
              isLoading={addMutation.isPending && addMutation.variables === p.id}
            >
              Add
            </Button>
          ),
        className: 'whitespace-nowrap',
      },
      {
        key: 'details',
        header: 'Details',
        render: (p: Player) => (
          <Button type="button" variant="secondary" onClick={() => openDetails(p.id)}>
            View
          </Button>
        ),
        className: 'whitespace-nowrap',
      },
    ],
    [addMutation.isPending, addMutation.mutate, addMutation.variables, openDetails],
  )

  const playersTable = useMemo(() => {
    if (playersQuery.isLoading) {
      return (
        <div className="np-card p-6 text-sm text-zinc-600 dark:text-zinc-400">
          Loading players…
        </div>
      )
    }

    if (playersQuery.isError) {
      return (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
          {playersQuery.error instanceof Error ? playersQuery.error.message : 'Failed to load players.'}
        </div>
      )
    }

    return (
      <Table
        columns={tableColumns}
        rows={players}
        getRowId={getPlayerRowId}
        isLoading={false}
        error={null}
        emptyText="No players match your filters."
      />
    )
  }, [getPlayerRowId, players, playersQuery.error, playersQuery.isError, playersQuery.isLoading, tableColumns])

  return (
    <div className="space-y-4">
      <div className="np-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Players</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {league ? <StatusBadge state={league.state} /> : null}
              <span>Browse and filter your player pool.</span>
            </div>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            Showing: <span className="font-mono">{drafted}</span>
          </div>
        </div>
        {pickupBanner ? <p className="mt-2 text-sm text-emerald-400">{pickupBanner}</p> : null}
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Last updated:{' '}
          {playersQuery.dataUpdatedAt
            ? new Date(playersQuery.dataUpdatedAt).toLocaleString()
            : 'Loading...'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {topInsightPlayers.map((p) => {
          const insight = insightByPlayerId.get(p.id)
          return (
            <div key={p.id} className="np-card p-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{p.team} • {p.position}</div>
              <div className="mt-2 text-xs">
                <span className={insight?.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
                  Trend: {insight?.trend === 'up' ? 'Up' : 'Down'}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Confidence: {insight?.confidence ?? '—'}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Volatility: {insight?.volatility ?? '—'}</div>
            </div>
          )
        })}
      </div>

      <div className="np-card p-5">
        <div className="np-card-inset p-3">
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="Saved filter name"
              value={savedFilterName}
              onChange={(e) => setSavedFilterName(e.target.value)}
              placeholder="e.g., Healthy WR sleepers"
              className="max-w-xs"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (!savedFilterName.trim()) return
                const entry = {
                  name: savedFilterName.trim(),
                  query,
                  updatedAt: new Date().toISOString(),
                }
                setSavedFilters((prev) => [entry, ...prev.filter((f) => f.name !== entry.name)].slice(0, 8))
                setSavedFilterName('')
              }}
            >
              Save filter
            </Button>
          </div>
          {savedFilters.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {savedFilters.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => {
                    setSearch(f.query.search ?? '')
                    setPosition(f.query.position ?? '')
                    setTeam(f.query.team ?? '')
                    setStatus((f.query.status as PlayerStatus | undefined) ?? 'any')
                    setDrafted(f.query.drafted ?? 'available')
                    setSort(f.query.sort ?? 'projectedPoints_desc')
                  }}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800 transition hover:border-zinc-300 dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  title={`Saved ${new Date(f.updatedAt).toLocaleString()}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or team…"
          />

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="position">
              Position
            </label>
            <select
              id="position"
              className={filterSelectClass}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">All</option>
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="team">
              Team
            </label>
            <select
              id="team"
              className={filterSelectClass}
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">All</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={filterSelectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as PlayerStatus | 'any')}
            >
              <option value="any">Any</option>
              <option value={PlayerStatusValues.ACTIVE}>{PlayerStatusValues.ACTIVE}</option>
              <option value={PlayerStatusValues.INJURED}>{PlayerStatusValues.INJURED}</option>
              <option value={PlayerStatusValues.OUT}>{PlayerStatusValues.OUT}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="drafted">
              Drafted
            </label>
            <select
              id="drafted"
              className={filterSelectClass}
              value={drafted}
              onChange={(e) => setDrafted(e.target.value as PlayerQuery['drafted'])}
            >
              <option value="available">Available</option>
              <option value="drafted">Drafted</option>
              <option value="any">Any</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sort">
              Sort
            </label>
            <select
              id="sort"
              className={filterSelectClass}
              value={sort}
              onChange={(e) => setSort(e.target.value as PlayerQuery['sort'])}
            >
              <option value="projectedPoints_desc">Projected points (high)</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {playersTable}

      <Modal
        open={detailOpen}
        title="Player Details"
        onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedPlayer ? (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-base font-semibold">
                {(playerDetailQuery.data ?? selectedPlayer).name}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {(playerDetailQuery.data ?? selectedPlayer).team} •{' '}
                {(playerDetailQuery.data ?? selectedPlayer).position}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-100">
                Status:{' '}
                <span className="font-medium">{(playerDetailQuery.data ?? selectedPlayer).status}</span>
              </span>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-100">
                Drafted:{' '}
                <span className="font-medium">
                  {(playerDetailQuery.data ?? selectedPlayer).drafted ? 'Yes' : 'No'}
                </span>
              </span>
            </div>

            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-zinc-900 dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-100">
              Projected points:{' '}
              <span className="font-mono">
                {(playerDetailQuery.data ?? selectedPlayer).projectedPoints}
              </span>
            </div>

            {playerDetailQuery.isLoading ? (
              <div className="text-xs text-zinc-500 dark:text-zinc-500">Loading scoring breakdown…</div>
            ) : playerDetailQuery.data?.scoringBreakdown ? (
              <ScoringBreakdownPanel breakdown={playerDetailQuery.data.scoringBreakdown} />
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Player not available.
          </div>
        )}
      </Modal>
    </div>
  )
}
