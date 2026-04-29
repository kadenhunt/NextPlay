import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import StandingsPage from '@/pages/league/StandingsPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Standings User' },
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

describe('SYS-08 Standings flow', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('1', 'user_1')
  })

  it('loads standings and supports sort changes', async () => {
    renderRoute('/league/1/standings', '/league/:id/standings', <StandingsPage />)

    expect(await screen.findByText('Standings')).toBeInTheDocument()
    expect(screen.getByText('Tie-breakers')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('Sort: Rank'), {
      target: { value: 'wins' },
    })

    expect(screen.getByDisplayValue('Sort: Most Wins')).toBeInTheDocument()
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})
