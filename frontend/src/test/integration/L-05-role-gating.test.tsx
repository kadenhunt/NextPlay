import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LeagueHomePage from '@/pages/league/LeagueHomePage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Role User' },
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
  userRole: 'COMMISSIONER',
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

describe('L-05 Commissioner vs member flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    await devResetMockDatabase()
  })

  it('shows commissioner controls for commissioner users', async () => {
    const league = await getMockLeagueById('1', 'user_1')
    authState.user = { id: 'user_1', displayName: 'Commissioner User' }
    leagueContext = {
      status: 'ready',
      league,
      error: null,
      userRole: 'COMMISSIONER',
    }

    renderRoute('/league/1', '/league/:id', <LeagueHomePage />)

    expect(await screen.findByText('League Overview')).toBeInTheDocument()
    expect(await screen.findByText('Commissioner Controls')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Draft Lobby' })).toBeInTheDocument()
  })

  it('hides commissioner controls for member users', async () => {
    const league = await getMockLeagueById('2', 'user_1')
    authState.user = { id: 'user_1', displayName: 'Member User' }
    leagueContext = {
      status: 'ready',
      league,
      error: null,
      userRole: 'MEMBER',
    }

    renderRoute('/league/2', '/league/:id', <LeagueHomePage />)

    expect(await screen.findByText('League Overview')).toBeInTheDocument()
    expect(screen.queryByText('Commissioner Controls')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start Draft' })).not.toBeInTheDocument()
  })
})
