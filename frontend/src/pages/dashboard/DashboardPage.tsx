import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import { onboardingStorageKey, readOnboardingSnapshot } from '@/utils/onboardingStorage'

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user, emailVerified, resendVerificationEmail, markEmailVerifiedForDemo } = useAuth()
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
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [onboardingChecks, setOnboardingChecks] = useState<Record<string, boolean>>({})

  const [inviteCode, setInviteCode] = useState('')

  const leaguesQuery = useQuery({
    queryKey: ['myLeagues', userId],
    queryFn: () => listMyLeagues(userId!),
    enabled: Boolean(userId),
  })

  const leagueCards = useMemo(() => leaguesQuery.data ?? [], [leaguesQuery.data])
  const commissionerCount = useMemo(
    () => leagueCards.filter((l) => l.role === 'COMMISSIONER').length,
    [leagueCards],
  )
  const activeCount = useMemo(
    () => leagueCards.filter((l) => l.state === 'SEASON_ACTIVE' || l.state === 'DRAFT_IN_PROGRESS').length,
    [leagueCards],
  )

  useEffect(() => {
    if (!userId) return
    const snap = readOnboardingSnapshot(userId)
    if (snap) {
      setOnboardingChecks(snap.checks)
      setOnboardingDismissed(snap.dismissed)
    }
  }, [userId, location.pathname])

  useEffect(() => {
    if (!userId) return
    const key = onboardingStorageKey(userId)
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          checks: onboardingChecks,
          dismissed: onboardingDismissed,
        }),
      )
    } catch {
      /* noop */
    }
  }, [onboardingChecks, onboardingDismissed, userId])

  useEffect(() => {
    if (leagueCards.length > 0) {
      setOnboardingChecks((prev) => ({ ...prev, joinedLeague: true }))
    }
  }, [leagueCards.length])

  useEffect(() => {
    if (emailVerified) {
      setOnboardingChecks((prev) => ({ ...prev, verifiedEmail: true }))
    }
  }, [emailVerified])

  useEffect(() => {
    if ((user?.displayName ?? '').trim().length >= 2) {
      setOnboardingChecks((prev) => ({ ...prev, updatedProfile: true }))
    }
  }, [user?.displayName])

  const checklistItems = [
    {
      key: 'verifiedEmail',
      label: 'Verify your email',
      done: Boolean(onboardingChecks.verifiedEmail),
      cta: 'Verify',
      action: () => {
        if (!emailVerified) {
          void resendVerificationEmail()
        }
      },
    },
    {
      key: 'joinedLeague',
      label: 'Join or create your first league',
      done: Boolean(onboardingChecks.joinedLeague),
      cta: 'Create/Join',
      action: () => setCreateOpen(true),
    },
    {
      key: 'openedLeague',
      label: 'Open a league workspace',
      done: Boolean(onboardingChecks.openedLeague),
      cta: 'Open league',
      action: () => {
        const firstLeague = leagueCards[0]
        if (firstLeague) {
          setOnboardingChecks((prev) => ({ ...prev, openedLeague: true }))
          navigate(`/league/${firstLeague.id}`)
        }
      },
    },
    {
      key: 'updatedProfile',
      label: 'Set your profile details',
      done: Boolean(onboardingChecks.updatedProfile),
      cta: 'Go to profile',
      action: () => navigate('/settings/account'),
    },
  ]
  const checklistDoneCount = checklistItems.filter((i) => i.done).length
  const showOnboarding = !onboardingDismissed && checklistDoneCount < checklistItems.length

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
      setOnboardingChecks((prev) => ({ ...prev, openedLeague: true }))
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
      setOnboardingChecks((prev) => ({ ...prev, openedLeague: true }))
      navigate(`/league/${joined.id}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join league')
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {!emailVerified ? (
        <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900">
              Verify your email to secure your account and receive league alerts.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="border-amber-300 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-100"
                onClick={() => void resendVerificationEmail()}
              >
                Resend verification
              </Button>
              {devMode ? (
                <Button
                  variant="secondary"
                  className="border-amber-300 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-100"
                  onClick={markEmailVerifiedForDemo}
                >
                  Mark verified (dev)
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Hero */}
      <div className="sporty-card relative overflow-hidden np-card p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-red-500/[0.03] blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
              Welcome back, {user?.displayName ?? 'Player'}
            </h1>
            <p className="max-w-[72ch] text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-display tracking-wide text-zinc-800 dark:text-zinc-200">Draft. Compete. Dominate.</span>{' '}
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
          <div className="rounded-lg border border-zinc-200 bg-zinc-100/90 px-4 py-3 dark:border-zinc-800/60 dark:bg-zinc-950/60">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Leagues
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {leagueCards.length}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-100/90 px-4 py-3 dark:border-zinc-800/60 dark:bg-zinc-950/60">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Commissioner
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {commissionerCount}
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/15 dark:bg-red-500/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-red-700 dark:text-red-400/80">
              {activeCount > 0 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                </span>
              )}
              Live
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{activeCount}</div>
          </div>
        </div>
      </div>

      {showOnboarding ? (
        <section className="np-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
                Getting Started Checklist
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {checklistDoneCount}/{checklistItems.length} complete.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setOnboardingDismissed(true)}>
              Dismiss
            </Button>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {checklistItems.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800/60 dark:bg-zinc-950/50"
              >
                <span>{item.label}</span>
                {item.done ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Done</span>
                ) : (
                  <button
                    type="button"
                    onClick={item.action}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700/70 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
                  >
                    {item.cta}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {devMode ? (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            isLoading={resetDemoMutation.isPending}
            onClick={() => {
              if (window.confirm('Reset all mock leagues and draft data to the demo seed?')) {
                resetDemoMutation.mutate()
              }
            }}
          >
            Reset data
          </Button>
        </div>
      ) : null}

      {/* League cards */}
      {leaguesQuery.isLoading ? (
        <div className="np-card p-6 text-sm text-zinc-600 dark:text-zinc-400">
          Loading leagues...
        </div>
      ) : leaguesQuery.isError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
          {leaguesQuery.error instanceof Error
            ? leaguesQuery.error.message
            : 'Failed to load leagues'}
        </div>
      ) : leagueCards.length === 0 ? (
        <div className="np-card p-8 text-center">
          <div className="text-zinc-600">
            <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.27.308 6.023 6.023 0 01-2.27-.308" />
            </svg>
          </div>
          <h2 className="mt-3 font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
            No leagues yet
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {leagueCards.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setOnboardingChecks((prev) => ({ ...prev, openedLeague: true }))
                navigate(`/league/${l.id}`)
              }}
              className="sporty-card group np-card p-5 text-left transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
            >
              {/* Mark onboarding once user enters a league workspace. */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 dark:group-hover:text-white">
                    {l.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <span>{sportLabel(l.sport)}</span>
                    <span className="text-zinc-400 dark:text-zinc-600">&middot;</span>
                    <span>{roleLabel(l.role)}</span>
                    <span className="text-zinc-400 dark:text-zinc-600">&middot;</span>
                    <span>{l.members.length} members</span>
                  </div>
                </div>

                <StatusBadge state={l.state} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800/60">
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">{l.inviteCode}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 transition group-hover:text-red-600 dark:text-zinc-400 dark:group-hover:text-red-400">
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
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="sport">
                Sport
              </label>
              <select
                id="sport"
                className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20"
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
