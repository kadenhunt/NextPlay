import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import { renderRoute } from '@/test/testUtils'

const listMyLeagues = vi.fn()
const createLeague = vi.fn()
const devResetMockDatabase = vi.fn()
const joinLeagueByInviteCode = vi.fn()

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
    emailVerified: true,
    resendVerificationEmail: vi.fn(),
    markEmailVerifiedForDemo: vi.fn(),
  }),
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: false,
  }),
}))

vi.mock('@/services/api/nextplayApi', () => ({
  listMyLeagues: (...args: unknown[]) => listMyLeagues(...args),
  createLeague: (...args: unknown[]) => createLeague(...args),
  devResetMockDatabase: (...args: unknown[]) => devResetMockDatabase(...args),
  joinLeagueByInviteCode: (...args: unknown[]) => joinLeagueByInviteCode(...args),
}))

describe('U-07 Dashboard Page', () => {
  beforeEach(() => {
    listMyLeagues.mockReset()
    createLeague.mockReset()
    devResetMockDatabase.mockReset()
    joinLeagueByInviteCode.mockReset()
  })

  it('shows the user leagues across sports', async () => {
    listMyLeagues.mockResolvedValue([
      {
        id: '1',
        name: 'Saturday Lights',
        sport: 'football',
        role: 'COMMISSIONER',
        state: 'CREATED',
        members: [{ userId: 'user_1' }, { userId: 'user_2' }],
      },
      {
        id: '2',
        name: 'Hardwood Pulse',
        sport: 'basketball',
        role: 'MEMBER',
        state: 'DRAFT_IN_PROGRESS',
        members: [{ userId: 'user_1' }, { userId: 'user_2' }, { userId: 'user_3' }],
      },
      {
        id: '3',
        name: 'Diamond Series',
        sport: 'baseball',
        role: 'MEMBER',
        state: 'SEASON_ACTIVE',
        members: [{ userId: 'user_1' }],
      },
    ])

    renderRoute('/dashboard', '/dashboard', <DashboardPage />)

    expect(await screen.findByText(/Welcome back, Player One/)).toBeInTheDocument()
    expect(await screen.findByText('Saturday Lights')).toBeInTheDocument()
    expect(await screen.findByText('Hardwood Pulse')).toBeInTheDocument()
    expect(await screen.findByText('Diamond Series')).toBeInTheDocument()
  })
})
