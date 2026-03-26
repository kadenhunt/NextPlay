import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLeague } from '@/providers/LeagueProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import {
  commissionerPauseDraft,
  commissionerSkipCurrentPick,
  commissionerStartDraft,
  devAutoCompleteDraft,
  devForceLeagueState,
  devSkipPick,
  getLeagueSettings,
  getMyTeamState,
  getPlayers,
  getDraftState,
  submitDraftPick,
  updateLineup,
  type PlayerQuery,
} from '@/services/api/nextplayApi'
import type { Player, PlayerId, PlayerStatus } from '@/types/models'
import { LeagueState as LS, PlayerStatus as PlayerStatusValues } from '@/types/models'
import {
  canCommissionerControlDraft,
  canEditLineup,
  isDraftState,
} from '@/utils/leagueGates'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Table from '@/components/Table'

function useCountdown(targetIso: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!targetIso) return

    const tick = () => {
      const target = new Date(targetIso).getTime()
      const now = Date.now()
      const diffMs = target - now
      setSecondsLeft(Math.max(0, Math.floor(diffMs / 1000)))
    }

    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [targetIso])

  const isDone = secondsLeft <= 0
  return { secondsLeft, isDone }
}

const MAX_STARTERS = 4
const DRAFT_QUEUE_STORAGE_PREFIX = 'nextplay.draftQueue.v1'

function loadDraftQueueFromStorage(leagueId: string, userId: string): PlayerId[] {
  try {
    const raw = localStorage.getItem(`${DRAFT_QUEUE_STORAGE_PREFIX}:${leagueId}:${userId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is PlayerId => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

export default function DraftPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''

  const { user } = useAuth()
  const userId = user?.id ?? null

  const { league, status: leagueLoadState, userRole } = useLeague()
  const { devMode } = useDevMode()

  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<string>('')
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | 'any'>('any')
  const [selectedError, setSelectedError] = useState<string | null>(null)
  const [draftQueueIds, setDraftQueueIds] = useState<PlayerId[]>([])

  useEffect(() => {
    if (!leagueId || !userId) return
    setDraftQueueIds(loadDraftQueueFromStorage(leagueId, userId))
  }, [leagueId, userId])

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['draftState', leagueId] }),
      queryClient.invalidateQueries({ queryKey: ['draftPlayers', leagueId] }),
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] }),
      queryClient.invalidateQueries({ queryKey: ['myLeagues'] }),
      queryClient.invalidateQueries({ queryKey: ['myTeamState', leagueId] }),
      queryClient.invalidateQueries({ queryKey: ['rosterPlayers', leagueId] }),
    ])
  }

  const draftQuery = useQuery({
    queryKey: ['draftState', leagueId, userId],
    queryFn: () => getDraftState(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
    refetchInterval: league?.state === 'DRAFT_IN_PROGRESS' ? 5000 : false,
  })

  const playersQuery = useQuery({
    queryKey: ['draftPlayers', leagueId, search, position, playerStatus],
    queryFn: async () => {
      const q: PlayerQuery = {
        search,
        position: position || undefined,
        status: playerStatus === 'any' ? undefined : playerStatus,
        drafted: 'available',
        sort: 'projectedPoints_desc',
      }
      return getPlayers(leagueId, userId!, q)
    },
    enabled: Boolean(leagueId && userId && league && draftQuery.data),
  })

  const queueLookupQuery = useQuery({
    queryKey: ['draftQueueLookup', leagueId, userId],
    queryFn: () =>
      getPlayers(leagueId, userId!, {
        drafted: 'available',
        sort: 'name_asc',
      }),
    enabled: Boolean(
      leagueId &&
        userId &&
        league &&
        draftQueueIds.length > 0 &&
        draftQuery.data &&
        draftQuery.data.status !== 'COMPLETE',
    ),
    staleTime: 15_000,
  })

  const teamQuery = useQuery({
    queryKey: ['myTeamState', leagueId, userId],
    queryFn: () => getMyTeamState(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
  })

  const settingsQuery = useQuery({
    queryKey: ['leagueSettings', leagueId, userId],
    queryFn: () => getLeagueSettings(leagueId, userId!),
    enabled: Boolean(leagueId && userId && league),
  })

  const rosterPlayersQuery = useQuery({
    queryKey: ['rosterPlayers', leagueId, userId],
    queryFn: async () => getPlayers(leagueId, userId!, { drafted: 'drafted' }),
    enabled: Boolean(leagueId && userId && teamQuery.data),
  })

  const { secondsLeft, isDone } = useCountdown(draftQuery.data?.timerEndsAt ?? null)

  const draftState = draftQuery.data
  const teamState = teamQuery.data
  const rosterPlayers = rosterPlayersQuery.data ?? []

  const pickedPlayerIds = useMemo(
    () => new Set(draftState?.picks.map((p) => p.playerId) ?? []),
    [draftState?.picks],
  )

  const playerLookupMap = useMemo(() => {
    const m = new Map<PlayerId, Player>()
    for (const p of playersQuery.data ?? []) m.set(p.id, p)
    for (const p of queueLookupQuery.data ?? []) m.set(p.id, p)
    return m
  }, [playersQuery.data, queueLookupQuery.data])

  useEffect(() => {
    setDraftQueueIds((prev) => {
      const next = prev.filter((id) => !pickedPlayerIds.has(id))
      if (next.length === prev.length) return prev
      if (leagueId && userId) {
        try {
          localStorage.setItem(
            `${DRAFT_QUEUE_STORAGE_PREFIX}:${leagueId}:${userId}`,
            JSON.stringify(next),
          )
        } catch {
          /* noop */
        }
      }
      return next
    })
  }, [pickedPlayerIds, leagueId, userId])

  const firstQueuedPickableId = useMemo(() => {
    for (const id of draftQueueIds) {
      if (pickedPlayerIds.has(id)) continue
      const p = playerLookupMap.get(id)
      if (p && !p.drafted) return id
    }
    return null
  }, [draftQueueIds, pickedPlayerIds, playerLookupMap])

  const totalPicks = settingsQuery.data
    ? (settingsQuery.data.teamCount * settingsQuery.data.draftRounds)
    : 0
  const picksMade = draftState?.picks.length ?? 0
  const draftProgress = totalPicks > 0 ? Math.round((picksMade / totalPicks) * 100) : 0
  const draftComplete = draftState?.status === 'COMPLETE'

  const rosterMap = useMemo(() => {
    if (!teamState) return new Map<PlayerId, Player>()
    return new Map(rosterPlayers.map((p) => [p.id, p]))
  }, [rosterPlayers, teamState])

  const starterIdsFromTeam = teamState?.team.lineup.starters ?? []
  const [starterDraft, setStarterDraft] = useState<PlayerId[]>(starterIdsFromTeam)

  useEffect(() => {
    setStarterDraft(starterIdsFromTeam)
  }, [starterIdsFromTeam.join(',')])

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [pickingPlayerId, setPickingPlayerId] = useState<PlayerId | null>(null)

  const pickMutation = useMutation({
    mutationFn: (playerId: PlayerId) => submitDraftPick(leagueId, userId!, playerId),
    onSuccess: async () => {
      setSelectedError(null)
      setPickingPlayerId(null)
      await invalidateAll()
    },
    onError: (err) => {
      setSelectedError(err instanceof Error ? err.message : 'Pick failed')
      setPickingPlayerId(null)
    },
  })

  const commissionerMutation = useMutation({
    mutationFn: async (action: 'start' | 'pause' | 'skip') => {
      if (action === 'start') return commissionerStartDraft(leagueId, userId!)
      if (action === 'pause') return commissionerPauseDraft(leagueId, userId!)
      return commissionerSkipCurrentPick(leagueId, userId!)
    },
    onSuccess: async () => {
      setSelectedError(null)
      await invalidateAll()
    },
    onError: (err) => setSelectedError(err instanceof Error ? err.message : 'Draft control failed'),
  })

  const devAutoCompleteMutation = useMutation({
    mutationFn: async () => {
      if (league?.state !== 'DRAFT_IN_PROGRESS') {
        await devForceLeagueState(leagueId, LS.DRAFT_IN_PROGRESS)
      }
      return devAutoCompleteDraft(leagueId, userId!)
    },
    onSuccess: async () => {
      setSelectedError(null)
      await invalidateAll()
    },
    onError: (err) => setSelectedError(err instanceof Error ? err.message : 'Auto-complete failed'),
  })

  const devStartDraftMutation = useMutation({
    mutationFn: async () => {
      await devForceLeagueState(leagueId, LS.DRAFT_IN_PROGRESS)
      return getDraftState(leagueId, userId!)
    },
    onSuccess: async () => {
      setSelectedError(null)
      await invalidateAll()
    },
    onError: (err) => setSelectedError(err instanceof Error ? err.message : 'Failed to start draft'),
  })

  const devSkipPickMutation = useMutation({
    mutationFn: async () => {
      if (league?.state !== 'DRAFT_IN_PROGRESS') {
        await devForceLeagueState(leagueId, LS.DRAFT_IN_PROGRESS)
      }
      return devSkipPick(leagueId, userId!)
    },
    onSuccess: async () => {
      setSelectedError(null)
      await invalidateAll()
    },
    onError: (err) => setSelectedError(err instanceof Error ? err.message : 'Skip failed'),
  })

  const updateLineupMutation = useMutation({
    mutationFn: async (nextStarters: PlayerId[]) => {
      if (!teamState) throw new Error('Team not loaded')
      const rosterSet = new Set(teamState.team.rosterPlayerIds)
      const starters = nextStarters.filter((id) => rosterSet.has(id))
      const bench = teamState.team.rosterPlayerIds.filter((id) => !starters.includes(id))
      return updateLineup(leagueId, userId!, { starters, bench })
    },
    onSuccess: async () => {
      setSaveError(null)
      await queryClient.invalidateQueries({ queryKey: ['myTeamState', leagueId] })
      await queryClient.invalidateQueries({ queryKey: ['rosterPlayers', leagueId] })
    },
    onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to save lineup'),
  })

  const draftAccess = devMode || Boolean(league && isDraftState(league.state))

  if (leagueLoadState === 'loading') {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-500">
        Loading draft...
      </div>
    )
  }

  if (leagueLoadState === 'error') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
        Failed to load league.
      </div>
    )
  }

  if (!draftAccess) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="text-sm text-zinc-500">
          Draft is not available in this league state. Enable Dev Mode to access all features.
        </div>
      </div>
    )
  }

  const isPickEnabled = Boolean(draftState?.isCurrentUserTurn && !isDone)

  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB'] as const
  const playerStatusOptions: Array<PlayerStatus | 'any'> = [
    'any',
    PlayerStatusValues.ACTIVE,
    PlayerStatusValues.INJURED,
    PlayerStatusValues.OUT,
  ]

  const rosterPlayersInTeam = teamState
    ? teamState.team.rosterPlayerIds
        .map((pid) => rosterMap.get(pid))
        .filter(Boolean)
    : []

  const lineupLocked = teamState?.isLineupLocked ?? true
  const lineupEditorEnabled = canEditLineup(lineupLocked)

  const toggleStarter = (playerId: PlayerId) => {
    if (lineupLocked) return
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

  const onSaveLineup = async () => {
    if (!teamState) return
    setSaveLoading(true)
    setSaveError(null)
    try {
      await updateLineupMutation.mutateAsync(starterDraft)
    } finally {
      setSaveLoading(false)
    }
  }

  const isInProgress = league?.state === 'DRAFT_IN_PROGRESS'
  const isScheduled = league?.state === 'DRAFT_SCHEDULED'
  const canControl = !devMode && canCommissionerControlDraft(league?.state ?? 'CREATED', userRole)

  const draftStatusLabel = draftComplete
    ? 'Complete'
    : isInProgress
      ? 'Live'
      : isScheduled
        ? 'Scheduled'
        : league?.state?.replaceAll('_', ' ') ?? 'Idle'

  const draftStatusColor = draftComplete
    ? 'text-zinc-400 border-zinc-700/40'
    : isInProgress
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.06]'
      : isScheduled
        ? 'text-amber-400 border-amber-500/30 bg-amber-500/[0.06]'
        : 'text-zinc-500 border-zinc-700/40'

  const anyDevLoading =
    devStartDraftMutation.isPending ||
    devSkipPickMutation.isPending ||
    devAutoCompleteMutation.isPending

  const isYourTurn = Boolean(isInProgress && draftState?.isCurrentUserTurn && !draftComplete)

  const addToQueue = (id: PlayerId) => {
    setDraftQueueIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      if (leagueId && userId) {
        try {
          localStorage.setItem(
            `${DRAFT_QUEUE_STORAGE_PREFIX}:${leagueId}:${userId}`,
            JSON.stringify(next),
          )
        } catch {
          /* noop */
        }
      }
      return next
    })
  }

  const removeFromQueue = (id: PlayerId) => {
    setDraftQueueIds((prev) => {
      const next = prev.filter((x) => x !== id)
      if (next.length === prev.length) return prev
      if (leagueId && userId) {
        try {
          localStorage.setItem(
            `${DRAFT_QUEUE_STORAGE_PREFIX}:${leagueId}:${userId}`,
            JSON.stringify(next),
          )
        } catch {
          /* noop */
        }
      }
      return next
    })
  }

  const moveInQueue = (index: number, dir: -1 | 1) => {
    setDraftQueueIds((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      ;[next[index], next[j]] = [next[j]!, next[index]!]
      if (leagueId && userId) {
        try {
          localStorage.setItem(
            `${DRAFT_QUEUE_STORAGE_PREFIX}:${leagueId}:${userId}`,
            JSON.stringify(next),
          )
        } catch {
          /* noop */
        }
      }
      return next
    })
  }

  const draftNextFromQueue = () => {
    if (!firstQueuedPickableId || !isPickEnabled) return
    setPickingPlayerId(firstQueuedPickableId)
    pickMutation.mutate(firstQueuedPickableId)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Draft Status Header */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          {isYourTurn && (
            <div className="mb-4 rounded-lg border-2 border-red-500/45 bg-red-500/[0.09] px-4 py-3 shadow-[0_0_28px_rgba(128,30,36,0.12)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-base font-bold uppercase tracking-wide text-red-200">Your pick</span>
                {teamState?.team.name ? (
                  <span className="text-sm font-medium text-zinc-400">
                    ({teamState.team.name})
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-300">
                {isDone
                  ? 'Pick window expired — you can still use dev tools or commissioner skip / auto-pick.'
                  : 'Select a player from the available list below.'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Draft Room</h2>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${draftStatusColor}`}>
                  {isInProgress && !draftComplete && (
                    <span className="relative mr-1.5 inline-flex h-1.5 w-1.5 align-middle">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  {draftStatusLabel}
                </span>
              </div>

              {draftState && !draftComplete ? (
                <>
                  <div className="text-sm text-zinc-400">
                    Pick{' '}
                    <span className="font-semibold text-zinc-100">
                      #{draftState.currentOverallPick}
                    </span>{' '}
                    of {totalPicks} (Round {draftState.currentRound})
                    {' '}&middot;{' '}
                    {isYourTurn ? (
                      <span className="font-bold text-red-300 underline decoration-red-500/40 underline-offset-4">
                        You are on the clock
                      </span>
                    ) : (
                      <>
                        On clock:{' '}
                        <span className="font-semibold text-zinc-100">{draftState.currentTeamName}</span>
                      </>
                    )}
                  </div>
                  {isInProgress && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-mono font-bold tabular-nums ${secondsLeft <= 10 ? 'text-red-400' : 'text-zinc-200'}`}>
                        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                      </span>
                      <span className="text-zinc-600">{isDone ? 'expired' : 'remaining'}</span>
                    </div>
                  )}
                </>
              ) : draftComplete ? (
                <div className="text-sm text-emerald-400/80">
                  All {picksMade} picks complete — rosters are set.
                </div>
              ) : null}
            </div>

            {/* Commissioner Controls (only when devMode is OFF) */}
            {canControl && (
              <div className="flex flex-wrap gap-2">
                {isScheduled && (
                  <Button
                    onClick={() => commissionerMutation.mutate('start')}
                    isLoading={commissionerMutation.isPending}
                  >
                    Start Draft
                  </Button>
                )}
                {isInProgress && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => commissionerMutation.mutate('pause')}
                      isLoading={commissionerMutation.isPending}
                    >
                      Pause
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => commissionerMutation.mutate('skip')}
                      isLoading={commissionerMutation.isPending}
                    >
                      Skip Pick
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {totalPicks > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <span>Draft Progress</span>
                <span className="tabular-nums">{picksMade}/{totalPicks} ({draftProgress}%)</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${draftComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                  style={{ width: `${draftProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Dev Mode Controls — always visible when devMode is on, works on any league/role */}
          {devMode && !draftComplete && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2.5">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-red-400/80">Dev</span>
              {!isInProgress && (
                <Button
                  onClick={() => devStartDraftMutation.mutate()}
                  isLoading={devStartDraftMutation.isPending}
                  disabled={anyDevLoading}
                >
                  Force Start
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => devSkipPickMutation.mutate()}
                isLoading={devSkipPickMutation.isPending}
                disabled={anyDevLoading}
              >
                Skip Pick
              </Button>
              <Button
                variant="destructive"
                onClick={() => devAutoCompleteMutation.mutate()}
                isLoading={devAutoCompleteMutation.isPending}
                disabled={anyDevLoading}
              >
                Auto-complete Draft
              </Button>
            </div>
          )}

          {selectedError && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-400">
              {selectedError}
            </div>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid gap-2 sm:grid-cols-3">
          <div
            className={[
              'rounded-xl border px-4 py-3',
              isYourTurn
                ? 'border-red-500/40 bg-red-500/[0.08] shadow-[0_0_20px_rgba(128,30,36,0.12)]'
                : 'border-zinc-800 bg-zinc-950/60',
            ].join(' ')}
          >
            <div
              className={[
                'text-[11px] font-medium uppercase tracking-wider',
                isYourTurn ? 'text-red-400/90' : 'text-zinc-500',
              ].join(' ')}
            >
              On clock
            </div>
            <div
              className={[
                'mt-0.5 truncate text-sm font-semibold',
                isYourTurn ? 'text-red-200' : 'text-zinc-100',
              ].join(' ')}
            >
              {draftComplete
                ? 'Draft Over'
                : isYourTurn
                  ? 'YOU — make your pick'
                  : draftState?.currentTeamName ?? 'Waiting...'}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Round</div>
            <div className="mt-0.5 text-sm font-semibold text-zinc-100">
              <span className="tabular-nums">{draftState?.currentRound ?? '—'}</span>
              <span className="text-zinc-500"> / </span>
              <span className="tabular-nums">{settingsQuery.data?.draftRounds ?? '—'}</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Type</div>
            <div className="mt-0.5 text-sm font-semibold text-zinc-100 capitalize">
              {settingsQuery.data?.draftType ?? 'snake'}
            </div>
          </div>
        </div>

        {/* Draft Board */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100">Draft Board</h3>
            {picksMade > 0 && (
              <span className="text-xs tabular-nums text-zinc-500">{picksMade} pick{picksMade !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="mt-4">
            {draftQuery.isLoading ? (
              <div className="text-sm text-zinc-500">Loading picks...</div>
            ) : draftQuery.isError ? (
              <div className="text-sm text-red-400">Failed to load draft state.</div>
            ) : draftState?.picks.length ? (
              <Table
                columns={[
                  {
                    key: 'pick',
                    header: '#',
                    render: (p) => <span className="font-mono text-zinc-400 tabular-nums">{p.overallPick}</span>,
                    className: 'w-12',
                  },
                  {
                    key: 'round',
                    header: 'Rd',
                    render: (p) => <span className="text-zinc-500 tabular-nums">{p.round}</span>,
                    className: 'w-12',
                  },
                  {
                    key: 'player',
                    header: 'Player',
                    render: (p) => <span className="font-medium text-zinc-100">{p.playerName}</span>,
                  },
                  {
                    key: 'team',
                    header: 'To',
                    render: (p) => <span className="text-zinc-300">{p.teamName}</span>,
                  },
                  {
                    key: 'auto',
                    header: 'Auto',
                    render: (p) => (
                      <span className={p.isAuto ? 'text-amber-400/80 text-[11px]' : 'text-zinc-700'}>
                        {p.isAuto ? 'AUTO' : '—'}
                      </span>
                    ),
                  },
                ]}
                rows={draftState.picks.slice().reverse()}
                getRowId={(p) => `${p.overallPick}_${p.playerId}`}
                emptyText="No picks yet."
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="text-zinc-600">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-zinc-500">Waiting for the draft to begin...</div>
              </div>
            )}
          </div>
        </div>

        {/* Available players (board) */}
        {!draftComplete && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold text-zinc-100">Available Players</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Search and filter. Queue players in the sidebar for quick picks on your turn, or use{' '}
              <span className="text-zinc-300">Draft next from queue</span> when you are on the clock.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Input
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or team..."
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300" htmlFor="pos">Position</label>
                <select
                  id="pos"
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <option value="">All</option>
                  {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
                  value={playerStatus}
                  onChange={(e) => setPlayerStatus(e.target.value as PlayerStatus | 'any')}
                >
                  {playerStatusOptions.map((s) => (
                    <option key={s} value={s}>{s === 'any' ? 'Any' : s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              {playersQuery.isLoading ? (
                <div className="text-sm text-zinc-500">Loading players...</div>
              ) : playersQuery.isError ? (
                <div className="text-sm text-red-400">Failed to load players.</div>
              ) : (
                <Table
                  columns={[
                    {
                      key: 'name',
                      header: 'Player',
                      render: (p) => (
                        <div className="space-y-0.5">
                          <div className="font-medium text-zinc-100">{p.name}</div>
                          <div className="text-xs text-zinc-500">{p.team} &middot; {p.position}</div>
                        </div>
                      ),
                    },
                    {
                      key: 'points',
                      header: 'Proj',
                      render: (p) => <span className="font-mono tabular-nums text-zinc-200">{p.projectedPoints}</span>,
                      className: 'whitespace-nowrap',
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (p) => (
                        <span className={`text-xs ${p.status === 'INJURED' ? 'text-amber-400' : p.status === 'OUT' ? 'text-red-400' : 'text-zinc-500'}`}>
                          {p.status}
                        </span>
                      ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (p) => (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            className="px-2.5"
                            disabled={draftQueueIds.includes(p.id) || p.drafted}
                            onClick={() => addToQueue(p.id)}
                          >
                            {draftQueueIds.includes(p.id) ? 'Queued' : 'Queue'}
                          </Button>
                          <Button
                            className="px-2.5"
                            onClick={() => {
                              setPickingPlayerId(p.id)
                              pickMutation.mutate(p.id)
                            }}
                            disabled={!isPickEnabled}
                            isLoading={pickMutation.isPending && pickingPlayerId === p.id}
                          >
                            Pick
                          </Button>
                        </div>
                      ),
                      className: 'whitespace-nowrap',
                    },
                  ]}
                  rows={playersQuery.data ?? []}
                  getRowId={(p) => p.id}
                  emptyText="No players match your filters."
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Roster */}
      <div className="space-y-4">
        {!draftComplete && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">Draft queue</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Priority order for your next picks. Reorder with the arrows; we skip anyone already drafted.
            </p>
            {draftQueueIds.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">Queue players from the table with the Queue button.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {draftQueueIds.map((qid, index) => {
                  const qp = playerLookupMap.get(qid)
                  const taken = pickedPlayerIds.has(qid) || qp?.drafted
                  return (
                    <li
                      key={qid}
                      className={[
                        'flex items-center gap-2 rounded-lg border px-2 py-2 text-sm',
                        taken
                          ? 'border-zinc-800/60 bg-zinc-950/30 text-zinc-600 line-through decoration-zinc-600'
                          : 'border-zinc-800 bg-zinc-950/50 text-zinc-200',
                      ].join(' ')}
                    >
                      <span className="w-5 shrink-0 text-center text-xs font-mono text-zinc-500">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {qp?.name ?? `Player ${qid.slice(0, 6)}…`}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveInQueue(index, -1)}
                          className="rounded border border-zinc-700/60 px-1.5 py-0.5 text-xs text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={index === draftQueueIds.length - 1}
                          onClick={() => moveInQueue(index, 1)}
                          className="rounded border border-zinc-700/60 px-1.5 py-0.5 text-xs text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label="Remove from queue"
                          onClick={() => removeFromQueue(qid)}
                          className="rounded border border-zinc-700/60 px-1.5 py-0.5 text-xs text-zinc-400 transition hover:border-red-500/40 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <Button
              className="mt-3 w-full"
              disabled={!isPickEnabled || !firstQueuedPickableId}
              isLoading={pickMutation.isPending && firstQueuedPickableId === pickingPlayerId}
              onClick={draftNextFromQueue}
            >
              Draft next from queue
            </Button>
            {isYourTurn && !firstQueuedPickableId && draftQueueIds.length > 0 && (
              <p className="mt-2 text-xs text-amber-400/90">
                No queued player is still available — update your queue or pick from the board.
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your team</p>
          <h3 className="mt-0.5 text-lg font-bold tracking-tight text-zinc-100">
            {teamQuery.isLoading ? '…' : teamState?.team.name ?? '—'}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            {rosterPlayersInTeam.length > 0 && (
              <span className="tabular-nums">{rosterPlayersInTeam.length} player{rosterPlayersInTeam.length !== 1 ? 's' : ''}</span>
            )}
            {!lineupLocked && rosterPlayersInTeam.length > 0 && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="tabular-nums">{starterDraft.length}/{MAX_STARTERS} starters</span>
              </>
            )}
            {lineupLocked && <span>Lineup locked</span>}
          </div>
        </div>

        {teamQuery.isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
            Loading roster...
          </div>
        ) : teamQuery.isError || !teamState ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
            Failed to load your team.
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            {rosterPlayersQuery.isLoading ? (
              <div className="text-sm text-zinc-500">Loading roster players...</div>
            ) : rosterPlayersInTeam.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="text-zinc-700">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div className="text-sm text-zinc-500">Draft players to build your roster.</div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {rosterPlayersInTeam.map((p) => {
                  const isStarter = starterDraft.includes(p!.id)
                  return (
                    <div
                      key={p!.id}
                      className={`group flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        isStarter
                          ? 'border-red-500/20 bg-red-500/[0.04]'
                          : 'border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-zinc-100">{p!.name}</span>
                          {isStarter && (
                            <span className="rounded bg-red-500/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-red-400">S</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {p!.team} &middot; {p!.position}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStarter(p!.id)}
                        disabled={!lineupEditorEnabled}
                        className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          isStarter
                            ? 'border-zinc-700/60 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                            : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {isStarter ? 'Bench' : 'Start'}
                      </button>
                    </div>
                  )
                })}

                {saveError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-sm text-red-400">
                    {saveError}
                  </div>
                )}

                {lineupEditorEnabled && (
                  <Button
                    className="mt-1 w-full"
                    onClick={onSaveLineup}
                    disabled={lineupLocked}
                    isLoading={saveLoading || updateLineupMutation.isPending}
                  >
                    Save Lineup
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
