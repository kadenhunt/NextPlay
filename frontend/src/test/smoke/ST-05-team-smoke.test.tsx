import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TeamPage from '@/pages/league/TeamPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Team User' },
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

describe('ST-05 Lineup set/save smoke', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('1', 'user_1')
  })

  it('loads the team page and roster summary', async () => {
    renderRoute('/league/1/team', '/league/:id/team', <TeamPage />)

    expect(await screen.findByText('Fantasy team')).toBeInTheDocument()
    expect(await screen.findByText(/Roster:/i)).toBeInTheDocument()
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})
