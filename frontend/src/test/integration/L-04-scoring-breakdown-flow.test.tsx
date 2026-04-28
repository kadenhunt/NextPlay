import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlayersPage from '@/pages/league/PlayersPage'
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

describe('L-04 Scoring breakdown integration', () => {
  beforeEach(async () => {
    localStorage.clear()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('3', 'user_1')
  })

  it('loads player details and renders the scoring breakdown panel', async () => {
    renderRoute('/league/3/players', '/league/:id/players', <PlayersPage />)

    expect(await screen.findByText('Players')).toBeInTheDocument()

    const table = await screen.findByRole('table')
    const firstRow = within(table).getAllByRole('row')[1]!

    fireEvent.click(within(firstRow).getByRole('button', { name: 'View' }))

    expect(await screen.findByText('Player Details')).toBeInTheDocument()
    expect(await screen.findByText('Point summary')).toBeInTheDocument()
    expect(await screen.findByText('Player fantasy total')).toBeInTheDocument()
  })
})
