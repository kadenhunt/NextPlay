import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import type { CreateLeagueInput } from '@/services/api/nextplayApi'
import {
  createLeague,
  devResetMockDatabase,
  joinLeagueByInviteCode,
  listMyLeagues,
} from '@/services/api/nextplayApi'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { devMode } = useDevMode()

  const userId = user?.id

  const resetDemoMutation = useMutation({
    mutationFn: () => devResetMockDatabase(),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  const [createName, setCreateName] = useState('')
  const [createSport, setCreateSport] = useState<CreateLeagueInput['sport']>('football')
  const [createTeamCount, setCreateTeamCount] = useState(8)
  const [createInviteCode, setCreateInviteCode] = useState('')

  const [inviteCode, setInviteCode] = useState('')

  const leaguesQuery = useQuery({
    queryKey: ['myLeagues', userId],
    queryFn: () => listMyLeagues(userId!),
    enabled: Boolean(userId),
  })

  const leagues = leaguesQuery.data ?? []
  const leagueCards = useMemo(() => leagues, [leagues])
  const commissionerCount = useMemo(
    () => leagueCards.filter((l) => l.role === 'COMMISSIONER').length,
    [leagueCards],
  )
  const activeCount = useMemo(
    () => leagueCards.filter((l) => l.state === 'SEASON_ACTIVE' || l.state === 'DRAFT_IN_PROGRESS').length,
    [leagueCards],
  )

  const roleLabel = (role: string) =>
    role === 'COMMISSIONER' ? 'Commissioner' : 'Member'

  const sportLabel = (sport: string) => {
    if (sport === 'football') return 'Football'
    if (sport === 'basketball') return 'Basketball'
    return 'Baseball'
  }

  const onCreate = async () => {
    if (!userId) return
    setCreateError(null)
    setCreateLoading(true)
    try {
      const input: CreateLeagueInput = {
        name: createName,
        sport: createSport,
        teamCount: createTeamCount,
        inviteCode: createInviteCode || undefined,
      }
      const created = await createLeague(input, userId)
      setCreateOpen(false)
      navigate(`/league/${created.id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create league')
    } finally {
      setCreateLoading(false)
    }
  }

  const onJoin = async () => {
    if (!userId) return
    setJoinError(null)
    setJoinLoading(true)
    try {
      const joined = await joinLeagueByInviteCode(inviteCode, userId)
      setJoinOpen(false)
      navigate(`/league/${joined.id}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join league')
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-red-500/[0.03] blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Welcome back, {user?.displayName ?? 'Player'}
            </h1>
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">Draft. Compete. Dominate.</span>{' '}
              Manage your fantasy leagues below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setJoinOpen(true)}>
              Join League
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Create League</Button>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Leagues</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">{leagueCards.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Commissioner</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">{commissionerCount}</div>
          </div>
          <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-red-400/80">
              {activeCount > 0 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                </span>
              )}
              Live
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-red-400">{activeCount}</div>
          </div>
        </div>
      </div>

      {devMode && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-400/80">Dev — mock data</p>
              <p className="mt-1 max-w-xl text-sm text-zinc-400">
                Restore leagues to the built-in demo seed (mix of created / draft / season states). No need to clear site data. You can also jump states from a league’s Overview when dev mode is on.
              </p>
            </div>
            <Button
              variant="destructive"
              isLoading={resetDemoMutation.isPending}
              onClick={() => {
                if (window.confirm('Reset all mock leagues and draft data to the demo seed?')) {
                  resetDemoMutation.mutate()
                }
              }}
            >
              Reset demo data
            </Button>
          </div>
          {resetDemoMutation.isError && (
            <p className="mt-2 text-sm text-red-400">
              {resetDemoMutation.error instanceof Error
                ? resetDemoMutation.error.message
                : 'Reset failed.'}
            </p>
          )}
        </div>
      )}

      {/* League cards */}
      {leaguesQuery.isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          Loading leagues...
        </div>
      ) : leaguesQuery.isError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
          {leaguesQuery.error instanceof Error
            ? leaguesQuery.error.message
            : 'Failed to load leagues'}
        </div>
      ) : leagueCards.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <div className="text-zinc-600">
            <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.27.308 6.023 6.023 0 01-2.27-.308" />
            </svg>
          </div>
          <h2 className="mt-3 text-base font-semibold text-zinc-100">No leagues yet</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Create a new league or join using an invite code to get started.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => setJoinOpen(true)}>
              Join League
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Create League</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {leagueCards.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => navigate(`/league/${l.id}`)}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold tracking-tight text-zinc-100 group-hover:text-white">
                    {l.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                    <span>{sportLabel(l.sport)}</span>
                    <span className="text-zinc-600">&middot;</span>
                    <span>{roleLabel(l.role)}</span>
                    <span className="text-zinc-600">&middot;</span>
                    <span>{l.members.length} members</span>
                  </div>
                </div>

                <StatusBadge state={l.state} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800/60 pt-3">
                <div className="text-xs text-zinc-500">
                  <span className="font-mono text-zinc-400">{l.inviteCode}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-red-400">
                  Open
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="Create League"
        onClose={() => {
          if (!createLoading) setCreateOpen(false)
        }}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button onClick={onCreate} isLoading={createLoading}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createError && <div className="text-sm text-red-400">{createError}</div>}

          <Input
            label="League name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g., Saturday Lights Conference"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300" htmlFor="sport">
                Sport
              </label>
              <select
                id="sport"
                className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20"
                value={createSport}
                onChange={(e) =>
                  setCreateSport(e.target.value as CreateLeagueInput['sport'])
                }
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="baseball">Baseball</option>
              </select>
            </div>

            <Input
              label="Team count"
              type="number"
              value={createTeamCount}
              onChange={(e) => setCreateTeamCount(Number(e.target.value))}
              min={2}
              max={10}
            />
          </div>

          <Input
            label="Invite code (optional)"
            value={createInviteCode}
            onChange={(e) => setCreateInviteCode(e.target.value)}
            placeholder="Leave blank to auto-generate"
          />
        </div>
      </Modal>

      {/* Join modal */}
      <Modal
        open={joinOpen}
        title="Join League"
        onClose={() => {
          if (!joinLoading) setJoinOpen(false)
        }}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setJoinOpen(false)} disabled={joinLoading}>
              Cancel
            </Button>
            <Button onClick={onJoin} isLoading={joinLoading}>
              Join
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {joinError && <div className="text-sm text-red-400">{joinError}</div>}

          <Input
            label="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="e.g., PLAY123"
          />

          <div className="text-xs text-zinc-500">
            Joining with a valid invite immediately adds you as a member.
          </div>
        </div>
      </Modal>
    </div>
  )
}
