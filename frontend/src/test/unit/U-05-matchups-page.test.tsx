import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MatchupsPage from '@/pages/league/MatchupsPage'
import { renderRoute } from '@/test/testUtils'

const getMatchups = vi.fn()
const getPlayers = vi.fn()
const getMatchupMessages = vi.fn()
const getMatchupInsight = vi.fn()
const getMatchupLineupScoring = vi.fn()
const postMatchupMessage = vi.fn()

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
  }),
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => ({
    league: { id: '1', state: 'SEASON_ACTIVE', sport: 'football' },
  }),
}))

vi.mock('@/services/api/nextplayApi', () => ({
  getMatchups: (...args: unknown[]) => getMatchups(...args),
  getPlayers: (...args: unknown[]) => getPlayers(...args),
  getMatchupMessages: (...args: unknown[]) => getMatchupMessages(...args),
  getMatchupInsight: (...args: unknown[]) => getMatchupInsight(...args),
  getMatchupLineupScoring: (...args: unknown[]) => getMatchupLineupScoring(...args),
  postMatchupMessage: (...args: unknown[]) => postMatchupMessage(...args),
}))

describe('U-05 Matchups Page', () => {
  beforeEach(() => {
    getMatchups.mockReset()
    getPlayers.mockReset()
    getMatchupMessages.mockReset()
    getMatchupInsight.mockReset()
    getMatchupLineupScoring.mockReset()
    postMatchupMessage.mockReset()
  })

  it('displays matchup and week data for the selected week', async () => {
    getMatchups.mockResolvedValue([
      {
        id: 'm_1',
        week: 1,
        homeTeamId: 't_1',
        awayTeamId: 't_2',
        homeTeamName: 'Route Runners',
        awayTeamName: 'Iron Valley',
        status: 'FINAL',
        homeScore: 124,
        awayScore: 118,
      },
    ])

    renderRoute('/league/1/matchups', '/league/:id/matchups', <MatchupsPage />)

    expect(await screen.findByText('Route Runners')).toBeInTheDocument()
    expect(screen.getByText('Iron Valley')).toBeInTheDocument()
    expect(screen.getByText('Selected Week')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
  })
})
