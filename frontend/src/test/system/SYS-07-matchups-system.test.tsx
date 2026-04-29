import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MatchupsPage from '@/pages/league/MatchupsPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Scoring User' },
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

describe('SYS-07 Matchups flow', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('3', 'user_1')
  })

  it('loads weekly matchups and opens matchup details', async () => {
    renderRoute('/league/3/matchups', '/league/:id/matchups', <MatchupsPage />)

    expect(await screen.findByRole('heading', { name: 'Matchups' })).toBeInTheDocument()
    fireEvent.click((await screen.findAllByRole('button', { name: 'View' }))[0]!)

    expect(await screen.findByText('Matchup Details')).toBeInTheDocument()
    expect(await screen.findByText('Point summary')).toBeInTheDocument()
    expect(await screen.findByText('Predictive Insight')).toBeInTheDocument()
  })
})
