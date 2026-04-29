import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MatchupsPage from '@/pages/league/MatchupsPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

import {
  measureAsyncStep,
  PERFORMANCE_THRESHOLDS_MS,
} from './performanceUtils'

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

describe('PERF-05 Matchup details load time', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('3', 'user_1')
  })

  it('opens matchup scoring details within the MVP threshold', async () => {
    renderRoute('/league/3/matchups', '/league/:id/matchups', <MatchupsPage />)

    expect(
      await screen.findByRole('heading', { name: 'Matchups' }, { timeout: 4000 }),
    ).toBeInTheDocument()

    await measureAsyncStep(
      'PERF-05 matchup detail open',
      PERFORMANCE_THRESHOLDS_MS.matchups,
      async () => {
        fireEvent.click((await screen.findAllByRole('button', { name: 'View' }))[0]!)
        expect(await screen.findByText('Matchup Details')).toBeInTheDocument()
        expect(await screen.findByText('Point summary')).toBeInTheDocument()
      },
    )
  })
})
