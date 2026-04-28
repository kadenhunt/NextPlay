import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlayersPage from '@/pages/league/PlayersPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Players User' },
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

async function loadPlayersPage(leagueId: string, userId = 'user_1') {
  leagueContext.league = await getMockLeagueById(leagueId, userId)
  return renderRoute(`/league/${leagueId}/players`, '/league/:id/players', <PlayersPage />)
}

describe('ST-08 External data fetched smoke', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('loads the football players page', async () => {
    await loadPlayersPage('1')

    expect(await screen.findByText('Players')).toBeInTheDocument()
    expect(await screen.findByText(/Browse and filter your player pool/i)).toBeInTheDocument()
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('loads the baseball players page', async () => {
    await loadPlayersPage('3')

    expect(await screen.findByText('Players')).toBeInTheDocument()
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('keeps the basketball players page usable through the current hybrid path', async () => {
    await loadPlayersPage('2')

    expect(await screen.findByText('Players')).toBeInTheDocument()
    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(1)

    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]!)
    expect(await screen.findByText('Player Details')).toBeInTheDocument()
  })
})
