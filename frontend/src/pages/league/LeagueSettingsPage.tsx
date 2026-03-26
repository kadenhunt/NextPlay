import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLeague } from '@/providers/LeagueProvider'
import {
  getLeagueAuditEvents,
  getLeagueSettings,
  regenerateLeagueInviteCode,
  removeLeagueMember,
  updateLeagueMemberRole,
  updateLeagueSettings,
} from '@/services/api/nextplayApi'
import Button from '@/components/Button'
import Input from '@/components/Input'
import StatusBadge from '@/components/StatusBadge'

export default function LeagueSettingsPage() {
  const { id: leagueIdParam } = useParams()
  const leagueId = leagueIdParam ?? ''
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { league, userRole } = useLeague()
  const queryClient = useQueryClient()

  const [draftForm, setDraftForm] = useState<{
    leagueName: string
    isPrivate: boolean
    draftType: 'snake' | 'auto'
    draftPickSeconds: number
    autoPickEnabled: boolean
    draftRounds: number
    scoringPreset: 'standard' | 'ppr'
    pointsPassTd: number
    pointsRushTd: number
    pointsRecTd: number
    pointsReception: number
    addDropEnabled: boolean
    tradeApproval: 'commissioner' | 'none'
  } | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['leagueSettings', leagueId, userId],
    queryFn: () => getLeagueSettings(leagueId, userId),
    enabled: Boolean(leagueId && userId && league),
  })

  const effectiveForm = draftForm ?? {
    leagueName: settingsQuery.data?.leagueName ?? '',
    isPrivate: settingsQuery.data?.isPrivate ?? true,
    draftType: settingsQuery.data?.draftType ?? 'snake',
    draftPickSeconds: settingsQuery.data?.draftPickSeconds ?? 45,
    autoPickEnabled: settingsQuery.data?.autoPickEnabled ?? false,
    draftRounds: settingsQuery.data?.draftRounds ?? 6,
    scoringPreset: settingsQuery.data?.scoringPreset ?? 'standard',
    pointsPassTd: settingsQuery.data?.pointsPassTd ?? 4,
    pointsRushTd: settingsQuery.data?.pointsRushTd ?? 6,
    pointsRecTd: settingsQuery.data?.pointsRecTd ?? 6,
    pointsReception: settingsQuery.data?.pointsReception ?? 0,
    addDropEnabled: settingsQuery.data?.addDropEnabled ?? true,
    tradeApproval: settingsQuery.data?.tradeApproval ?? 'commissioner',
  }

  const auditQuery = useQuery({
    queryKey: ['leagueAudit', leagueId, userId],
    queryFn: () => getLeagueAuditEvents(leagueId, userId),
    enabled: Boolean(leagueId && userId && league && userRole === 'COMMISSIONER'),
  })

  const refreshAfterMutation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['leagueSettings', leagueId] }),
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] }),
      queryClient.invalidateQueries({ queryKey: ['myLeagues'] }),
      queryClient.invalidateQueries({ queryKey: ['draftState', leagueId] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateLeagueSettings(leagueId, userId, {
        leagueName: effectiveForm.leagueName,
        isPrivate: effectiveForm.isPrivate,
        draftType: effectiveForm.draftType,
        draftPickSeconds: effectiveForm.draftPickSeconds,
        autoPickEnabled: effectiveForm.autoPickEnabled,
        draftRounds: effectiveForm.draftRounds,
        scoringPreset: effectiveForm.scoringPreset,
        pointsPassTd: effectiveForm.pointsPassTd,
        pointsRushTd: effectiveForm.pointsRushTd,
        pointsRecTd: effectiveForm.pointsRecTd,
        pointsReception: effectiveForm.pointsReception,
        addDropEnabled: effectiveForm.addDropEnabled,
        tradeApproval: effectiveForm.tradeApproval,
      }),
    onSuccess: async () => {
      setBanner('Settings saved.')
      await refreshAfterMutation()
    },
    onError: (err) => setBanner(err instanceof Error ? err.message : 'Unable to save settings'),
  })

  const inviteMutation = useMutation({
    mutationFn: () => regenerateLeagueInviteCode(leagueId, userId),
    onSuccess: async (nextCode) => {
      setBanner(`Invite code regenerated: ${nextCode}`)
      await refreshAfterMutation()
    },
    onError: (err) => setBanner(err instanceof Error ? err.message : 'Unable to regenerate invite code'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ targetUserId, role }: { targetUserId: string; role: 'MEMBER' | 'COMMISSIONER' }) =>
      updateLeagueMemberRole(leagueId, userId, targetUserId, role),
    onSuccess: async () => {
      setBanner('Member role updated.')
      await refreshAfterMutation()
    },
    onError: (err) => setBanner(err instanceof Error ? err.message : 'Unable to update role'),
  })

  const removeMutation = useMutation({
    mutationFn: (targetUserId: string) => removeLeagueMember(leagueId, userId, targetUserId),
    onSuccess: async () => {
      setBanner('Member removed from league.')
      await refreshAfterMutation()
    },
    onError: (err) => setBanner(err instanceof Error ? err.message : 'Unable to remove member'),
  })

  if (!league) return null

  const isCommissioner = userRole === 'COMMISSIONER'
  if (!isCommissioner) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">
        Commissioner access required for league settings.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">League Settings</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <StatusBadge state={league.state} />
              <span>Commissioner controls and draft configuration.</span>
            </div>
          </div>
        </div>
        {banner ? <p className="mt-3 text-sm text-emerald-400">{banner}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">League Configuration</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                label="League name"
                value={effectiveForm.leagueName}
                onChange={(e) =>
                  setDraftForm((prev) => ({ ...(prev ?? effectiveForm), leagueName: e.target.value }))
                }
                disabled={!isCommissioner || settingsQuery.isLoading}
              />
              <Input
                label="Sport"
                value={settingsQuery.data?.sport ?? ''}
                disabled
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={effectiveForm.isPrivate}
                  disabled={!isCommissioner}
                  onChange={(e) =>
                    setDraftForm((prev) => ({ ...(prev ?? effectiveForm), isPrivate: e.target.checked }))
                  }
                />
                Private league
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            {/* Handoff note: this settings surface maps directly to mock controls.
                Replace these with backend policy endpoints once commissioner settings API is available. */}
            <h3 className="text-base font-semibold">Draft Options</h3>
            <p className="mt-1 text-xs text-emerald-400">Changes apply immediately after save.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="draftType" className="text-sm font-medium">Draft type</label>
                <select
                  id="draftType"
                  value={effectiveForm.draftType}
                  disabled={!isCommissioner}
                  onChange={(e) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? effectiveForm),
                      draftType: e.target.value as 'snake' | 'auto',
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
                >
                  <option value="snake">Snake draft</option>
                  <option value="auto">Auto draft</option>
                </select>
              </div>
              <Input
                label="Pick timer (seconds)"
                type="number"
                min={15}
                max={120}
                value={effectiveForm.draftPickSeconds}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    draftPickSeconds: Number(e.target.value),
                  }))
                }
                disabled={!isCommissioner}
              />
              <Input
                label="Draft rounds"
                type="number"
                min={2}
                max={20}
                value={effectiveForm.draftRounds}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    draftRounds: Number(e.target.value),
                  }))
                }
                disabled={!isCommissioner}
              />
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={effectiveForm.autoPickEnabled}
                disabled={!isCommissioner}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    autoPickEnabled: e.target.checked,
                  }))
                }
              />
              Enable auto-pick fallback
            </label>
            <div className="mt-4 flex justify-end">
              <Button disabled={!isCommissioner} isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                Apply Draft Changes Now
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Scoring and Transactions</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="scoringPreset" className="text-sm font-medium">Scoring preset</label>
                <select
                  id="scoringPreset"
                  value={effectiveForm.scoringPreset}
                  onChange={(e) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? effectiveForm),
                      scoringPreset: e.target.value as 'standard' | 'ppr',
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
                >
                  <option value="standard">Standard</option>
                  <option value="ppr">PPR</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="tradeApproval" className="text-sm font-medium">Trade approval</label>
                <select
                  id="tradeApproval"
                  value={effectiveForm.tradeApproval}
                  onChange={(e) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? effectiveForm),
                      tradeApproval: e.target.value as 'commissioner' | 'none',
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-500/60"
                >
                  <option value="commissioner">Commissioner review</option>
                  <option value="none">No review</option>
                </select>
              </div>
              <Input
                label="Pass TD points"
                type="number"
                min={0}
                max={10}
                value={effectiveForm.pointsPassTd}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    pointsPassTd: Number(e.target.value),
                  }))
                }
              />
              <Input
                label="Rush TD points"
                type="number"
                min={0}
                max={10}
                value={effectiveForm.pointsRushTd}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    pointsRushTd: Number(e.target.value),
                  }))
                }
              />
              <Input
                label="Rec TD points"
                type="number"
                min={0}
                max={10}
                value={effectiveForm.pointsRecTd}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    pointsRecTd: Number(e.target.value),
                  }))
                }
              />
              <Input
                label="Reception points"
                type="number"
                min={0}
                max={3}
                step="0.5"
                value={effectiveForm.pointsReception}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    pointsReception: Number(e.target.value),
                  }))
                }
              />
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={effectiveForm.addDropEnabled}
                onChange={(e) =>
                  setDraftForm((prev) => ({
                    ...(prev ?? effectiveForm),
                    addDropEnabled: e.target.checked,
                  }))
                }
              />
              Enable add/drop transactions
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Invite</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Code: <span className="font-mono text-zinc-100">{settingsQuery.data?.inviteCode ?? '—'}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Capacity: {settingsQuery.data?.teamCount ?? 0}/{settingsQuery.data?.maxTeams ?? 0}
            </p>
            <Button
              className="mt-3 w-full"
              variant="secondary"
              disabled={!isCommissioner}
              isLoading={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              Regenerate Invite Code
            </Button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-base font-semibold">Roster Rules</h3>
            <div className="mt-2 text-sm text-zinc-400">
              <div>Roster cap: {settingsQuery.data?.rosterCap ?? 10}</div>
              <div>Starter slots: {settingsQuery.data?.lineupStarters ?? 4}</div>
            </div>
            <Button
              className="mt-3 w-full"
              disabled={!isCommissioner}
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-base font-semibold">Member Management</h3>
        <div className="mt-3 space-y-2">
          {league.members.map((m) => {
            const isSelf = m.userId === userId
            return (
              <div key={m.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{m.displayName}</div>
                  <div className="text-xs text-zinc-500">{m.role}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={!isCommissioner || isSelf || m.role === 'COMMISSIONER'}
                    isLoading={roleMutation.isPending}
                    onClick={() => roleMutation.mutate({ targetUserId: m.userId, role: 'COMMISSIONER' })}
                  >
                    Promote
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!isCommissioner || isSelf || m.role === 'MEMBER'}
                    isLoading={roleMutation.isPending}
                    onClick={() => roleMutation.mutate({ targetUserId: m.userId, role: 'MEMBER' })}
                  >
                    Demote
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!isCommissioner || isSelf || m.role === 'COMMISSIONER'}
                    isLoading={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(m.userId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-base font-semibold">League Audit Trail</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Operational event feed for commissioner handoff and backend logging alignment.
        </p>
        <div className="mt-3 space-y-2">
          {(auditQuery.data ?? []).length ? (
            (auditQuery.data ?? []).slice(0, 12).map((evt) => (
              <div key={evt.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-200">{evt.type}</span>
                  <span className="text-[11px] text-zinc-600">{new Date(evt.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {evt.actorDisplayName}: {evt.message}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-500">No audit events yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

