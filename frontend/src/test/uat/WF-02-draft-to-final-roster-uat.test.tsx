import { cleanup, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DraftPage from '@/pages/league/DraftPage'
import TeamPage from '@/pages/league/TeamPage'
import { LeagueState } from '@/types/models'
import {
  devAutoCompleteDraft,
  devForceLeagueState,
  devResetMockDatabase,
  getDraftState as getMockDraftState,
  getLeagueById as getMockLeagueById,
  getMyTeamState,
} from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Draft Workflow User' },
}

let leagueContext: {
  status?: 'ready'
  league: Awaited<ReturnType<typeof getMockLeagueById>> | null
  error?: string | null
  userRole?: 'MEMBER' | 'COMMISSIONER'
} = {
  league: null,
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({ devMode: false }),
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => leagueContext,
}))

async function findCurrentDraftUserId(leagueId: string) {
  const draftState = await getMockDraftState(leagueId, 'user_1')

  for (let index = 1; index <= 8; index += 1) {
    const userId = `user_${index}`
    try {
      const teamState = await getMyTeamState(leagueId, userId)
      if (teamState.team.id === draftState.currentTeamId) {
        return userId
      }
    } catch {
      // Ignore users not in this league.
    }
  }

  throw new Error('Unable to find current draft user')
}

describe('WF-02 Enter draft, draft players, and view final rosters', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    await devForceLeagueState('1', LeagueState.DRAFT_IN_PROGRESS)

    const currentUserId = await findCurrentDraftUserId('1')
    authState.user = { id: currentUserId, displayName: `Draft Workflow ${currentUserId}` }

    const league = await getMockLeagueById('1', currentUserId)
    leagueContext = {
      status: 'ready',
      league,
      error: null,
      userRole: league.role,
    }
  })

  it('drafts a player, completes the draft, and shows the final roster', async () => {
    renderRoute('/league/1/draft', '/league/:id/draft', <DraftPage />)

    expect(await screen.findByText(/You are on the clock/i)).toBeInTheDocument()
    expect(await screen.findByText('Available Players')).toBeInTheDocument()

    await devAutoCompleteDraft('1', authState.user.id)

    const teamState = await getMyTeamState('1', authState.user.id)
    expect(teamState.team.rosterPlayerIds.length).toBeGreaterThan(0)

    leagueContext.league = await getMockLeagueById('1', authState.user.id)

    cleanup()
    renderRoute('/league/1/team', '/league/:id/team', <TeamPage />)

    expect(await screen.findByText('Fantasy team')).toBeInTheDocument()
    expect(await screen.findByText(new RegExp(`Roster: ${teamState.team.rosterPlayerIds.length}/`))).toBeInTheDocument()
  })
})
