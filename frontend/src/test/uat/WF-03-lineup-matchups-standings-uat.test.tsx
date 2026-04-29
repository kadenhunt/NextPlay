import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MatchupsPage from '@/pages/league/MatchupsPage'
import StandingsPage from '@/pages/league/StandingsPage'
import TeamPage from '@/pages/league/TeamPage'
import { LeagueState } from '@/types/models'
import {
  devAutoCompleteDraft,
  devForceLeagueState,
  devResetMockDatabase,
  getLeagueById as getMockLeagueById,
  getMyTeamState,
} from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Season Workflow User' },
}

let leagueContext: {
  league: Awaited<ReturnType<typeof getMockLeagueById>> | null
} = {
  league: null,
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => leagueContext,
}))

describe('WF-03 Set lineup, review matchup results, and view standings', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    await devForceLeagueState('1', LeagueState.DRAFT_IN_PROGRESS)
    await devAutoCompleteDraft('1', 'user_1')
    leagueContext.league = await getMockLeagueById('1', 'user_1')
  })

  it('updates the lineup and keeps matchup and standings views usable', async () => {
    const initialTeamState = await getMyTeamState('1', 'user_1')
    const initialStarters = initialTeamState.team.lineup.starters.slice()

    renderRoute('/league/1/team', '/league/:id/team', <TeamPage />)

    fireEvent.click((await screen.findAllByRole('button', { name: 'Bench' }))[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'Save lineup' }))

    await waitFor(async () => {
      const nextTeamState = await getMyTeamState('1', 'user_1')
      expect(nextTeamState.team.lineup.starters).not.toEqual(initialStarters)
    })

    cleanup()

    renderRoute('/league/1/matchups', '/league/:id/matchups', <MatchupsPage />)
    expect(await screen.findByRole('heading', { name: 'Matchups' })).toBeInTheDocument()
    expect(await screen.findByText('No matchups found for Week 1.')).toBeInTheDocument()

    cleanup()

    renderRoute('/league/1/standings', '/league/:id/standings', <StandingsPage />)
    expect(await screen.findByText('Standings')).toBeInTheDocument()
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})
