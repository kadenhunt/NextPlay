import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MatchupsPage from '@/pages/league/MatchupsPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Matchup User' },
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

describe('ST-06 Weekly scores smoke', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('1', 'user_1')
  })

  it('loads the matchups page', async () => {
    renderRoute('/league/1/matchups', '/league/:id/matchups', <MatchupsPage />)

    expect(await screen.findByRole('heading', { name: 'Matchups' })).toBeInTheDocument()
    expect(await screen.findByText('Selected Week')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Week 1' })).toBeInTheDocument()
  })
})
