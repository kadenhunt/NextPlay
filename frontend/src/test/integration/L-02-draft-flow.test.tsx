import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DraftPage from '@/pages/league/DraftPage'
import { LeagueState } from '@/types/models'
import {
  devForceLeagueState,
  devResetMockDatabase,
  getDraftState as getMockDraftState,
  getLeagueById as getMockLeagueById,
  getMyTeamState,
} from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Test User' },
}

let leagueContext: {
  status: 'ready'
  league: Awaited<ReturnType<typeof getMockLeagueById>> | null
  error: string | null
  userRole: 'MEMBER' | 'COMMISSIONER'
} = {
  status: 'ready',
  league: null,
  error: null,
  userRole: 'MEMBER',
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

describe('L-02 Draft flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    await devResetMockDatabase()
    await devForceLeagueState('1', LeagueState.DRAFT_IN_PROGRESS)

    const currentUserId = await findCurrentDraftUserId('1')
    authState.user = { id: currentUserId, displayName: `Draft User ${currentUserId}` }

    const league = await getMockLeagueById('1', currentUserId)
    leagueContext = {
      status: 'ready',
      league,
      error: null,
      userRole: league.role,
    }
  })

  it('loads the draft room and shows the current draft state safely', async () => {
    renderRoute('/league/1/draft', '/league/:id/draft', <DraftPage />)

    expect(await screen.findByText('Draft Room')).toBeInTheDocument()
    expect(await screen.findByText(/You are on the clock/i)).toBeInTheDocument()
    expect(await screen.findByText('Available Players')).toBeInTheDocument()
    expect(await screen.findByText('No players match your filters.')).toBeInTheDocument()
  })
})
