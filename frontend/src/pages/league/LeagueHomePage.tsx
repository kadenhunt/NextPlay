import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Button from '@/components/Button'
import { useAuth } from '@/providers/AuthProvider'
import { useDevMode } from '@/providers/DevModeProvider'
import StatusBadge from '@/components/StatusBadge'
import { useLeague } from '@/providers/LeagueProvider'
import {
  commissionerPauseDraft,
  commissionerSetLeagueState,
  commissionerStartDraft,
  devForceLeagueState,
} from '@/services/api/nextplayApi'
import type { LeagueState } from '@/types/models'
import { LeagueState as LeagueStateValues } from '@/types/models'

const DEV_JUMP_STATES: { state: LeagueState; label: string }[] = [
  { state: LeagueStateValues.CREATED, label: 'Created' },
  { state: LeagueStateValues.DRAFT_SCHEDULED, label: 'Draft lobby' },
  { state: LeagueStateValues.DRAFT_IN_PROGRESS, label: 'Draft live' },
  { state: LeagueStateValues.SEASON_ACTIVE, label: 'Season' },
  { state: LeagueStateValues.PLAYOFFS, label: 'Playoffs' },
  { state: LeagueStateValues.COMPLETE, label: 'Complete' },
]

export default function LeagueHomePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { status, league, error, userRole } = useLeague()
  const { devMode } = useDevMode()
  const userId = user?.id ?? ''

  const invalidateAll = async () => {
    if (!league) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['league', league.id] }),
      queryClient.invalidateQueries({ queryKey: ['myLeagues'] }),
      queryClient.invalidateQueries({ queryKey: ['draftState', league.id] }),
    ])
  }

  const transitionMutation = useMutation({
    mutationFn: async (action: 'open-draft' | 'start-draft' | 'pause-draft' | 'season' | 'playoffs' | 'complete') => {
      if (!league) throw new Error('League not loaded')
      if (!userId) throw new Error('Not authenticated')

      if (devMode) {
        const stateMap = {
          'open-draft': LeagueStateValues.DRAFT_SCHEDULED,
          'start-draft': LeagueStateValues.DRAFT_IN_PROGRESS,
          'pause-draft': LeagueStateValues.DRAFT_SCHEDULED,
          'season': LeagueStateValues.SEASON_ACTIVE,
          'playoffs': LeagueStateValues.PLAYOFFS,
          'complete': LeagueStateValues.COMPLETE,
        } as const
        await devForceLeagueState(league.id, stateMap[action])
        return
      }

      if (action === 'open-draft') {
        return commissionerSetLeagueState(league.id, userId, LeagueStateValues.DRAFT_SCHEDULED)
      }
      if (action === 'start-draft') {
        await commissionerStartDraft(league.id, userId)
        return commissionerSetLeagueState(league.id, userId, LeagueStateValues.DRAFT_IN_PROGRESS)
      }
      if (action === 'pause-draft') {
        await commissionerPauseDraft(league.id, userId)
        return commissionerSetLeagueState(league.id, userId, LeagueStateValues.DRAFT_SCHEDULED)
      }
      if (action === 'season') {
        return commissionerSetLeagueState(league.id, userId, LeagueStateValues.SEASON_ACTIVE)
      }
      if (action === 'playoffs') {
        return commissionerSetLeagueState(league.id, userId, LeagueStateValues.PLAYOFFS)
      }
      return commissionerSetLeagueState(league.id, userId, LeagueStateValues.COMPLETE)
    },
    onSuccess: invalidateAll,
  })

  const jumpStateMutation = useMutation({
    mutationFn: (next: LeagueState) => {
      if (!league) throw new Error('League not loaded')
      return devForceLeagueState(league.id, next)
    },
    onSuccess: invalidateAll,
  })

  const showControls = devMode || userRole === 'COMMISSIONER'

  const roleLabel = (role: string) =>
    role === 'COMMISSIONER' ? 'Commissioner' : 'Member'

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
        Loading league details...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
        {error ?? 'Failed to load league.'}
      </div>
    )
  }

  if (!league) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        League not found.
      </div>
    )
  }

  const stateActions: Array<{ action: Parameters<typeof transitionMutation.mutate>[0]; label: string; variant: 'primary' | 'secondary' | 'destructive'; when: string[] }> = [
    { action: 'open-draft', label: 'Open Draft Lobby', variant: 'primary', when: ['CREATED'] },
    { action: 'start-draft', label: 'Start Draft', variant: 'primary', when: ['DRAFT_SCHEDULED'] },
    { action: 'pause-draft', label: 'Pause Draft', variant: 'secondary', when: ['DRAFT_IN_PROGRESS'] },
    { action: 'season', label: 'Advance to Season', variant: 'primary', when: ['DRAFT_IN_PROGRESS'] },
    { action: 'playoffs', label: 'Advance to Playoffs', variant: 'secondary', when: ['SEASON_ACTIVE'] },
    { action: 'complete', label: 'Mark Complete', variant: 'destructive', when: ['PLAYOFFS'] },
  ]

  const visibleActions = stateActions.filter((a) => a.when.includes(league.state))

  return (
    <div className="space-y-5">
      {/* Overview card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">League Overview</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Sport: <span className="font-medium text-zinc-200 capitalize">{league.sport}</span> &middot; Invite:{' '}
              <span className="font-mono text-zinc-300">{league.inviteCode}</span>
            </p>
          </div>
          <StatusBadge state={league.state} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Members</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">{league.members.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your Role</div>
            <div className="mt-1 text-lg font-semibold text-zinc-100">{roleLabel(userRole ?? 'MEMBER')}</div>
          </div>
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">State</div>
            <div className="mt-1 text-sm font-semibold text-zinc-200">{league.state.replaceAll('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Navigation + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-zinc-100">Navigate</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Jump to any section in this league.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="draft"><Button variant="secondary">Draft</Button></Link>
            <Link to="team"><Button variant="secondary">My Team</Button></Link>
            <Link to="players"><Button variant="secondary">Players</Button></Link>
            <Link to="matchups"><Button variant="secondary">Matchups</Button></Link>
            <Link to="standings"><Button variant="secondary">Standings</Button></Link>
            <Link to="playoffs"><Button variant="secondary">Playoffs</Button></Link>
            <Link to="chat"><Button variant="secondary">Chat</Button></Link>
            {(userRole === 'COMMISSIONER' || devMode) && (
              <Link to="settings"><Button variant="secondary">Settings</Button></Link>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h3 className="text-base font-semibold text-zinc-100">Quick Actions</h3>
          <div className="mt-3 space-y-2">
            <Link to="draft" className="block rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-200">
              Open Draft Room
            </Link>
            <Link to="standings" className="block rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-200">
              View Standings
            </Link>
            <Link to="matchups" className="block rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-200">
              View Matchups
            </Link>
          </div>
        </div>
      </div>

      {/* State Transition Controls */}
      {showControls && (
        <div className={`rounded-xl border p-5 ${devMode ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-zinc-800 bg-zinc-900/60'}`}>
          <div className="flex items-center gap-2">
            {devMode && <span className="text-[11px] font-bold uppercase tracking-wider text-red-400/80">Dev</span>}
            <h3 className="text-base font-semibold text-zinc-100">
              {devMode ? 'State Controls' : 'Commissioner Controls'}
            </h3>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {devMode
              ? 'Advance the league through any state for demo purposes.'
              : 'Manage league state transitions.'}
          </p>
          {visibleActions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleActions.map((a) => (
                <Button
                  key={a.action}
                  variant={a.variant}
                  isLoading={transitionMutation.isPending}
                  onClick={() => transitionMutation.mutate(a.action)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-zinc-500">
              No transitions available from the current state.
            </div>
          )}
          {transitionMutation.isError && (
            <p className="mt-2 text-sm text-red-400">
              {transitionMutation.error instanceof Error ? transitionMutation.error.message : 'Unable to change league state.'}
            </p>
          )}

          {devMode && (
            <div className="mt-5 border-t border-red-500/15 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400/70">Jump to state</p>
              <p className="mt-1 text-xs text-zinc-500">
                Rewind or skip ahead without clearing your browser. For a full fresh seed, use Reset demo data on the dashboard.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEV_JUMP_STATES.map(({ state, label }) => (
                  <Button
                    key={state}
                    variant="secondary"
                    className="text-xs"
                    disabled={jumpStateMutation.isPending || league.state === state}
                    isLoading={
                      jumpStateMutation.isPending && jumpStateMutation.variables === state
                    }
                    onClick={() => jumpStateMutation.mutate(state)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {jumpStateMutation.isError && (
                <p className="mt-2 text-sm text-red-400">
                  {jumpStateMutation.error instanceof Error ? jumpStateMutation.error.message : 'Jump failed.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-100">Members</h3>
          <span className="text-xs tabular-nums text-zinc-500">{league.members.length}</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {league.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-3 py-2 transition hover:border-zinc-700/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
                  {m.displayName.charAt(0)}
                </div>
                <div className="text-sm font-medium text-zinc-200">{m.displayName}</div>
              </div>
              <div className={`text-xs ${m.role === 'COMMISSIONER' ? 'text-red-400/80' : 'text-zinc-500'}`}>{roleLabel(m.role)}</div>
            </div>
          ))}
          {league.members.length === 0 && (
            <div className="text-sm text-zinc-400">No members yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
