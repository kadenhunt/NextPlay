import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LeagueHomePage from '@/pages/league/LeagueHomePage'
import { renderRoute } from '@/test/testUtils'

const getLeagueMemberSpotlight = vi.fn()
const getTopTickerItems = vi.fn()
const commissionerPauseDraft = vi.fn()
const commissionerSetLeagueState = vi.fn()
const commissionerStartDraft = vi.fn()
const devForceLeagueState = vi.fn()

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
  }),
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: false,
  }),
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => ({
    status: 'ready',
    error: null,
    userRole: 'COMMISSIONER',
    league: {
      id: '1',
      name: 'Saturday Lights: East Division',
      sport: 'football',
      state: 'CREATED',
      inviteCode: 'PLAY123',
      members: [
        { userId: 'user_1', displayName: 'Player One', role: 'COMMISSIONER' },
        { userId: 'user_2', displayName: 'Player Two', role: 'MEMBER' },
      ],
    },
  }),
}))

vi.mock('@/services/api/nextplayApi', () => ({
  getLeagueMemberSpotlight: (...args: unknown[]) => getLeagueMemberSpotlight(...args),
  getTopTickerItems: (...args: unknown[]) => getTopTickerItems(...args),
  commissionerPauseDraft: (...args: unknown[]) => commissionerPauseDraft(...args),
  commissionerSetLeagueState: (...args: unknown[]) => commissionerSetLeagueState(...args),
  commissionerStartDraft: (...args: unknown[]) => commissionerStartDraft(...args),
  devForceLeagueState: (...args: unknown[]) => devForceLeagueState(...args),
}))

describe('U-06 League Page', () => {
  beforeEach(() => {
    getLeagueMemberSpotlight.mockReset()
    getTopTickerItems.mockReset()
    commissionerPauseDraft.mockReset()
    commissionerSetLeagueState.mockReset()
    commissionerStartDraft.mockReset()
    devForceLeagueState.mockReset()
  })

  it('shows commissioner status and league summary details', async () => {
    getLeagueMemberSpotlight.mockResolvedValue([
      { userId: 'user_1', displayName: 'Player One', teamName: 'Route Runners', wins: 0, losses: 0, rank: 1 },
      { userId: 'user_2', displayName: 'Player Two', teamName: 'Iron Valley', wins: 0, losses: 0, rank: 2 },
    ])
    getTopTickerItems.mockResolvedValue([])

    renderRoute('/league/1', '/league/:id', <LeagueHomePage />)

    expect(await screen.findByText('League Overview')).toBeInTheDocument()
    expect(screen.getByText(/Sport:/)).toBeInTheDocument()
    expect(screen.getAllByText('Commissioner').length).toBeGreaterThan(0)
    expect(screen.getByText('PLAY123')).toBeInTheDocument()
  })
})
