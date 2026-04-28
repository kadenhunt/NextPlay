import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TeamPage from '@/pages/league/TeamPage'
import {
  devAutoCompleteDraft,
  devForceLeagueState,
  devResetMockDatabase,
  getLeagueById as getMockLeagueById,
  getMyTeamState,
} from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'
import { LeagueState } from '@/types/models'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Team User' },
}

let leagueContext: {
  league: Awaited<ReturnType<typeof getMockLeagueById>> | null
} = {
  league: null,
}

let initialStarters: string[] = []

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => leagueContext,
}))

describe('RT-05 Lineup save regression', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    await devForceLeagueState('1', LeagueState.DRAFT_IN_PROGRESS)
    await devAutoCompleteDraft('1', 'user_1')
    leagueContext.league = await getMockLeagueById('1', 'user_1')

    const teamState = await getMyTeamState('1', 'user_1')
    initialStarters = teamState.team.lineup.starters.slice()
  })

  it('still saves an updated lineup through the current hybrid flow', async () => {
    renderRoute('/league/1/team', '/league/:id/team', <TeamPage />)

    fireEvent.click((await screen.findAllByRole('button', { name: 'Bench' }))[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'Save lineup' }))

    await waitFor(async () => {
      const nextTeamState = await getMyTeamState('1', 'user_1')
      expect(nextTeamState.team.lineup.starters).not.toEqual(initialStarters)
    })
  })
})
