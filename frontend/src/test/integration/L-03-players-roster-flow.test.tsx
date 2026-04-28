import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlayersPage from '@/pages/league/PlayersPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Roster User' },
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

describe('L-03 Players roster adjustment flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('1', 'user_1')
  })

  it('adds a player to my team and updates the page state', async () => {
    renderRoute('/league/1/players', '/league/:id/players', <PlayersPage />)

    expect(await screen.findByText('Players')).toBeInTheDocument()

    const table = await screen.findByRole('table')
    const bodyRows = within(table).getAllByRole('row').slice(1)
    const firstRow = bodyRows[0]!
    const playerName = within(firstRow).getAllByRole('cell')[0]!.textContent ?? ''

    fireEvent.click(within(firstRow).getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Player added to your roster.')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(playerName)).not.toBeInTheDocument()
    })
  })
})
