import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlayersPage from '@/pages/league/PlayersPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

import {
  measureAsyncStep,
  PERFORMANCE_THRESHOLDS_MS,
} from './performanceUtils'

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

describe('PERF-04 Football players page load time', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('1', 'user_1')
  })

  it('loads the football players table within the MVP threshold', async () => {
    renderRoute('/league/1/players', '/league/:id/players', <PlayersPage />)

    await measureAsyncStep(
      'PERF-04 football players load',
      PERFORMANCE_THRESHOLDS_MS.players,
      async () => {
        expect(
          await screen.findByRole('table', {}, { timeout: 5000 }),
        ).toBeInTheDocument()
        expect(await screen.findByText(/Browse and filter your player pool/i)).toBeInTheDocument()
      },
    )
  })
})
